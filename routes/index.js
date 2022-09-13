module.exports = function (io) {
  const { Router } = require("express");
  const router = Router();
  const jwt = require("jsonwebtoken");
  const mqtt = require("mqtt");
  const fs = require("fs");

  const projectId = `da-prueba-iot`;
  const registryId = `my-registry`;
  const region = `us-central1`;
  const algorithm = `RS256`;
  const privateKeyFile = `./rsa_private.pem`;
  const mqttBridgeHostname = `mqtt.googleapis.com`;
  const mqttBridgePort = 443;
  const messageType = `events`;
  const deviceId = `dispositivo-10`;

  const { readTables, executeQuery } = require("../services/googleBigquery");

  const createJwt = (projectId, privateKeyFile, algorithm) => {
    const token = {
      iat: parseInt(Date.now() / 1000),
      exp: parseInt(Date.now() / 1000) + 60 * 160,
      aud: projectId,
    };
    const privateKey = fs.readFileSync(privateKeyFile);
    return jwt.sign(token, privateKey, { algorithm: algorithm });
  };

  const mqttClientId = `projects/${projectId}/locations/${region}/registries/${registryId}/devices/${deviceId}`;

  const connectionArgs = {
    host: mqttBridgeHostname,
    port: mqttBridgePort,
    clientId: mqttClientId,
    username: "unused",
    password: createJwt(projectId, privateKeyFile, algorithm),
    protocol: "mqtts",
    secureProtocol: "TLSv1_2_method",
  };

  var client = mqtt.connect(connectionArgs);

  
  client.subscribe(`/devices/${deviceId}/config`, { qos: 1 });
  client.subscribe(`/devices/${deviceId}/commands/#`, { qos: 0 });
  const mqttTopic = `/devices/${deviceId}/${messageType}`;

  client.on("connect", (success) => {
    console.log(client.connected);
    if (!success) {
      console.log("Client not connected...");
    }
  });

  client.on("close", () => {
    console.log("close");
  });

  client.on("error", (err) => {
    console.log("error", err);
  });

  io.on("connection", (socket) => {
    socket.on("accelerometer", (message) => {
      payload = JSON.stringify(message);
      client.publish(mqttTopic, payload, { qos: 1 });
      console.log("published: " + payload);
    });
  });

  router.get("/carrera", (req, res) => {
    res.render("carrera", {
      title: "GSS IoT",
      session: false,
      alumno: "No valido su usuario",
    });
  });

  router.get("/", function (req, res) {
    res.render("index", { title: "GSS IoT", error: false });
  });

  router.post("/carrera", async function (req, res) {
    const body = req.body;
    const [rows] = await executeQuery({
      dataSetName: "GSS",
      tableName: "Alumno",
      query: `SELECT * FROM Alumno WHERE dniAlum=${Number(body.usuario)}`,
    });
    if (rows.length === 0) {
      res.render("index", { title: "GSS IoT", error: true, session: false });
      return;
    }

    console.log(req.body);
    res.render("carrera", {
      title: "GSS IoT",
      session: true,
      alumno: String(body.usuario),
    });
  });

  router.get("/resultados", async function (req, res) {
    const result = await readTables({
      dataSetName: "GSS",
      tableName: "IoT",
      query: `SELECT primNomAlum, tiempo , ritmo  FROM IoT as iot, Alumno alu where iot.dniAlum = alu.dniAlum and iot.estado='Resultado' and iot.fechaReg BETWEEN '2022-05-02' AND '2022-05-08' order by tiempo `,
    });
    res.render("resultados", { title: "Resultados", resultados: result });
  });

  return router;
};

// module.exports = router;

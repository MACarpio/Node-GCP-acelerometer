const { BigQuery } = require("@google-cloud/bigquery");
const bigquery = new BigQuery();

async function readTables({ dataSetName,tableName,query}){
    const dataset = bigquery.dataset(dataSetName);

    const table = dataset.table(tableName);

    const [rows] = await table.query(query);

    return rows;
}
async function executeQuery({ dataSetName, tableName, query }) {
    const dataset = bigquery.dataset(dataSetName);
    const table = dataset.table(tableName);
    const result = await table.query(query);
    return result;
  }
module.exports = {
    readTables,
    executeQuery,
}
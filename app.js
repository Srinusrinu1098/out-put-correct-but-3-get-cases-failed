const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDbToServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db Error :${e.message}`);
    process.exit(1);
  }
};
initializeDbToServer();

//get
const convertDBtoObject = (dbObject) => {
  return {
    stateID: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

app.get("/states/", async (request, response) => {
  const getDbDetails = `
    SELECT
    *
    FROM
    state;`;
  const dbResponse = await db.all(getDbDetails);
  response.send(dbResponse.map((each) => convertDBtoObject(each)));
});

//get single
const convertDBtoObject1 = (dbObject) => {
  return {
    stateID: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getDbDetails = `
    SELECT
    *
    FROM
    state
    WHERE state_id = ${stateId};`;
  const dbResponse = await db.all(getDbDetails);
  response.send(dbResponse.map((each) => convertDBtoObject1(each)));
});

//post

app.post("/districts/", async (request, response) => {
  const dbDetails = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = dbDetails;

  const postSql = `
  INSERT INTO district(district_name,state_id,cases,cured,active,deaths) VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const dbResponse = await db.run(postSql);
  const districtId = dbResponse.lastID;
  response.send("District Successfully Added");
});

//get district

const convertDBtoObject2 = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.death,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDbDetails1 = `
    SELECT
    *
    FROM
    district
    WHERE district_id = ${districtId};`;
  const dbResponse = await db.all(getDbDetails1);
  response.send(dbResponse.map((each) => convertDBtoObject2(each)));
});

// delete
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteData = `
    DELETE FROM district WHERE district_id = ${districtId};`;
  await db.run(deleteData);
  response.send("District Removed");
});

//put

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const dbDetails1 = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = dbDetails1;

  const updateTheDataDis = `
    UPDATE district SET district_name = '${districtName}',state_id = ${stateId},cases=${cases},cured =${cured},active = ${active},deaths = ${deaths} WHERE district_id = ${districtId};`;
  const dbResponse2 = await db.run(updateTheDataDis);
  response.send("District Details Updated");
});

//get stats

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getDb = `
  SELECT 
  SUM(cases),
  SUM(cured),
  SUM(active),
  SUM(deaths)
  FROM district WHERE state_id = ${stateId};`;
  const dbResponse4 = await db.get(getDb);
  console.log(dbResponse4);
  response.send({
    totalCases: dbResponse4["SUM(cases)"],
    totalCured: dbResponse4["SUM(cured)"],
    totalActive: dbResponse4["SUM(active)"],
    totalDeaths: dbResponse4["SUM(deaths)"],
  });
});

// get details

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
select state_id from district
where district_id = ${districtId};
`;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);

  const getStateNameQuery = `
select state_name as stateName from state
where state_id = ${getDistrictIdQueryResponse.state_id};
`;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;

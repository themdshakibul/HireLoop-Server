const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT;
const uri = process.env.MONGDB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const database = client.db("Hire");
    const JobsCollections = database.collection("Jobs");
    const companyCollections = database.collection("companies");

    // get
    app.get("/api/jobs", async (req, res) => {
      const query = {};
      if (req.query.companyId) {
        query.companyId = req.query.companyId;
      }

      if (req.query.status) {
        query.status = req.query.status;
      }

      const result = await JobsCollections.find(query).toArray();
      res.json(result);
    });

    // post
    app.post("/api/jobs", async (req, res) => {
      const job = req.body;
      const result = await JobsCollections.insertOne(job);
      res.json(result);
    });

    // company Releted api
    app.get("/api/my/companies", async (req, res) => {
      const query = {};
      if (req.query.recruiterId) {
        query.recruiterId = req.query.recruiterId;
      }
      const result = await companyCollections.findOne(query);
      res.json(result);
    });

    app.post("/api/companies", async (req, res) => {
      const companies = req.body;
      const result = await companyCollections.insertOne(companies);
      res.json(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to the HireLoop!");
});

app.listen(port, () => {
  console.log(`HireLoop app listening on port ${port}`);
});

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
    const userCollectons = database.collection("user");
    const applicationsCollections = database.collection("applications");
    const planCollections = database.collection("plans");

    app.get("/api/users", async (req, res) => {
      const result = await userCollectons.find().skip(6).toArray();
      res.json(result);
    });

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

    app.get("/api/jobs/:id", async (req, res) => {
      const { id } = req.params;
      const query = {
        _id: new ObjectId(id),
      };

      const result = await JobsCollections.findOne(query);
      res.json(result);
    });

    // post
    app.post("/api/jobs", async (req, res) => {
      const job = req.body;
      const newJobs = {
        ...job,
        createdAt: new Date(),
      };
      const result = await JobsCollections.insertOne(newJobs);
      res.json(result);
    });

    // applications Releted api
    app.get("/api/applications", async (req, res) => {
      const query = {};
      if (req.query.applicantId) {
        query.applicantId = req.query.applicantId;
      }
      if (req.query.jobId) {
        query.jobId = req.query.jobId;
      }
      const cursor = await applicationsCollections.find(query).toArray();
      res.json(cursor);
    });

    app.post("/api/applications", async (req, res) => {
      const applications = req.body;
      const newApplications = {
        ...applications,
        createdAt: new Date(),
      };
      const result = await applicationsCollections.insertOne(newApplications);
      res.json(result);
    });

    // company Releted api
    app.get("/api/companies", async (req, res) => {
      const result = await companyCollections.find().toArray();
      res.json(result);
    });

    app.get("/api/my/companies", async (req, res) => {
      const query = {};
      if (req.query.recruiterId) {
        query.recruiterId = req.query.recruiterId;
      }
      const result = await companyCollections.findOne(query);
      res.json(result || {});
    });

    app.post("/api/companies", async (req, res) => {
      const companies = req.body;
      const newCompany = {
        ...companies,
        createdAt: new Date(),
      };
      const result = await companyCollections.insertOne(newCompany);
      res.json(result);
    });

    // plans Releted api
    app.get("/api/plans", async (req, res) => {
      const query = {};
      if (req.query.plan_id) {
        query.id = req.query.plan_id;
      }
      const plan = await planCollections.findOne(query);
      res.json(plan);
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

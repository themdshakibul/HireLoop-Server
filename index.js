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

// jwt token
const logger = async (req, res, next) => {
  next();
};

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
    const subCriptionCollections = database.collection("subcriptions");
    const sessionCollections = database.collection("session");

    // veryFecation Releted api
    const veryFyToken = async (req, res, next) => {
      const authHeder = req.headers?.authorization;
      if (!authHeder) {
        return res.status(401).send({ message: "Unothorize Access" });
      }

      const token = authHeder.split(" ")[1];

      if (!token) {
        return res.status(401).send({ message: "Unothorize Access" });
      }

      const query = { token: token };
      const session = await sessionCollections.findOne(query);
      const userId = session.userId;

      const userQuary = {
        _id: userId,
      };

      const user = await userCollectons.findOne(userQuary);
      // Set data in the req Object
      req.user = user;
      next();
    };

    // must be used veryfytoken middleware
    const veriFySeeker = async (req, res, next) => {
      if (req.user?.role !== "seeker") {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      next();
    };

    // must be used veryfytoken middleware
    const veryFyRecruiter = async (res, req, next) => {
      if (req.user?.role !== "recruiter") {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      next();
    };

    // must be used veryfytoken middleware
    const verifyAdmin = (req, res, next) => {
      if (req.user?.role !== "admin") {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      next();
    };

    // get jobs releted api
    app.get("/api/jobs", async (req, res) => {
      const query = {};

      //  job fileter releted api

      if (req.query.search) {
        query.$or = [
          { jobTitle: { $regex: req.query.search, $options: "i" } },
          { companyName: { $regex: req.query.search, $options: "i" } },
        ]
      }

      if (req.query.jobType) {
        query.jobType = req.query.jobType;
      }

      if (req.query.jobCategory) {
        query.jobCategory = req.query.jobCategory;
      }

      if (req.query.isRemote) {
        query.isRemote = req.query.isRemote;
      }

      // compan releted api
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
    app.get(
      "/api/applications",
      veryFyToken,
      veriFySeeker,
      async (req, res) => {
        const query = {};
        if (req.query.applicantId) {
          query.applicantId = req.query.applicantId;

          // check whether asking for user information on some else
          console.log(req.user, req.query.applicantId);

          if (req.user._id.toString() !== req.query.applicantId) {
            return res.status(403).send({ message: "Forbidden Access" });
          }
        }
        if (req.query.jobId) {
          query.jobId = req.query.jobId;
        }
        const cursor = await applicationsCollections.find(query).toArray();
        res.json(cursor);
      },
    );

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
    // app.get("/api/companies", async (req, res) => {
    //   const result = await companyCollections.find().toArray();
    //   res.json(result);
    // });

    // inefficent way to join/aggreget collection
    app.get("/api/companies", veryFyToken, verifyAdmin, async (req, res) => {
      const companies = await companyCollections.find().toArray();

      for (const company of companies) {
        const fileter = {
          companyId: company._id.toString(),
        };
        const jobCount = await JobsCollections.countDocuments(fileter);
        company.jobCount = jobCount;
      }
      res.json(companies);
    });

    app.get("/api/companies2", async (req, res) => {
      const pipeline = [
        {
          $skip: 5,
        },
        {
          $limit: 2,
        },
      ];

      const result = companyCollections.aggregate(pipeline).toArray();
      res.json(result);
    });

    app.get("/api/stats", async (req, res) => {
      const pipeline = [
        {
          $group: {
            _id: "$jobType",
            count: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            jobType: "$_id",
            _id: 0,
            count: 1,
          },
        },
        {
          $sort: { count: 1 },
        },
      ];

      const result = await JobsCollections.aggregate(pipeline).toArray();
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

    app.patch(
      "/api/companies/:id",
      logger,
      veryFyToken,
      verifyAdmin,
      async (req, res) => {
        const { id } = req.params;
        const updatedCompany = req.body;

        const fileter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            status: updatedCompany.status,
          },
        };

        const result = await companyCollections.updateOne(fileter, updatedDoc);
        res.json(result);
      },
    );

    // plans Releted api
    app.get("/api/plans", async (req, res) => {
      const query = {};
      if (req.query.plan_id) {
        query.id = req.query.plan_id;
      }
      const plan = await planCollections.findOne(query);
      res.json(plan);
    });

    // Subcriptions Releted api
    app.post("/api/subcriptions", async (req, res) => {
      const data = req.body;
      const subInfo = {
        ...data,
        createdAt: new Date(),
      };

      const result = await subCriptionCollections.insertOne(subInfo);

      // updata the user plan information
      const filter = { email: data.email };
      const updateDocument = {
        $set: {
          plan: data.planId,
        },
      };

      const updateResult = await userCollectons.updateOne(
        filter,
        updateDocument,
      );
      res.send(updateDocument);
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

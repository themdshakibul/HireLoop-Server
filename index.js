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

    // post
    app.post("/josb", async (req, res) => {
      const job = req.body;
      const result = await JobsCollections.insertOne(jsb);
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

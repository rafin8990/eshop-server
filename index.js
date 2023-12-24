const express = require("express")
const cors = require("cors");
const session = require("express-session");
const bodyParser = require("body-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nuouh7o.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const productCollection = client.db("eshop").collection("products");
    const cartCollection = client.db("eshop").collection("cartItem");
    const userCollection = client.db("eshop").collection("users");

    app.get("/products", async (req, res) => {
      const result = await productCollection.find().toArray();
      res.send(result);
    });
    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await productCollection.findOne(filter);
      res.send(result);
    });

    app.post("/cart/add", async (req, res) => {
      const cartData = req.body;

      const productInCart = await cartCollection.findOne({
        productId: cartData.productId,
        color: cartData.color,
        size: cartData.size,
      });

      if (productInCart) {
        productInCart.quantity += cartData.quantity;
        await cartCollection.updateOne(
          { _id: productInCart._id },
          { $set: productInCart }
        );
      } else {
        await cartCollection.insertOne(cartData);
      }

      res.json({ acknowledged: true });
    });

    app.get("/carts", async (req, res) => {
      const result = await cartCollection.find().toArray();
      res.send(result);
    });

    app.delete("/cart/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(filter);
      res.send(result);
    });

    app.post("/register", async (req, res) => {
      const { name, email, password } = req.body;
      const existingUser = await userCollection.findOne({ email });

      if (existingUser) {
        return res.status(400).send("Email already exists");
      }
      const result = await userCollection.insertOne({ name, email, password });
      res.send(result)
    });

    app.post('/login', async (req, res) => {
        const { email, password } = req.body;
        const user = await userCollection.findOne({ email, password });
        if (user) {
          req.session.user = user;
          res.status(200).send({acknowledged:true});
        } else {
          res.status(401).send('Invalid credentials');
        }
    });

    app.get('/checkLogin', (req, res) => {
      if (req.session.user) {
        res.status(200).send('authenticated');
      } else {
        res.status(401).send('unauthenticated');
      }
    });

    app.get('/logout', (req, res) => {
      req.session.destroy();
      res.status(200).send('Logout successful');
    });

    console.log(" You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("eshop server is running ");
});

app.listen(port, () => {
  console.log(`eshop server is running on port ${port}`);
});

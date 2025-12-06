const express = require("express");
const app = express();

const cookieParser = require("cookie-parser");
const path = require("path");



const ownersRouter = require("./routes/ownersRouter");
const usersRouter = require("./routes/usersRouter");
const productsRouter = require("./routes/productsRouter");
const index = require("./routes/index");


require("dotenv").config(); // to use the variables that are in .env file

const database = require("./config/mongoose-connection");

const session = require("express-session");
const flash = require("connect-flash");

app.use(
  session({
    secret: process.env.EXPRESS_SESSION_SECRET || "development-secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash());









app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

app.use("/owners",ownersRouter);
app.use("/users",usersRouter);
app.use("/products",productsRouter);

app.use("/", index); 

app.listen(3000);
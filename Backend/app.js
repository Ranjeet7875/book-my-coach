const express=require("express")
const CollectionDB = require("./config/db")
const userRoutes=require("./routes/user.route")
const app=express()
app.use(express.json())
CollectionDB()

app.get("/set",(req,res)=>{
    res.send("book my coach")
})
app.use("/register",userRoutes)
app.listen(4000,()=>{
    console.log("Server Started")
})
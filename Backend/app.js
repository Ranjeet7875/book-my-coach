const express=require("express")
const cors=require("cors")
const CollectionDB = require("./config/db")
const userRoutes=require("./routes/user.route")
const seatRouter=require("./routes/seat.route")
const app=express()

app.use(express.json())

CollectionDB()
app.use(cors())

app.get("/set",(req,res)=>{
    res.send("book my coach")
})
app.use("/register",userRoutes)
app.use("/seats",seatRouter)
app.listen(4000,()=>{
    console.log("Server Started")
})
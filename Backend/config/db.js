const mongoose=require("mongoose")
require('dotenv').config();
const DB=process.env.DB_URL
const CollectionDB=async()=>{
    try {
        await mongoose.connect(DB)
        console.log("DB Connected to Server")
    } catch (error) {
        console.log("DB is not connect to Server")
    }
}
module.exports=CollectionDB
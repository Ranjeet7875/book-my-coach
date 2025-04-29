const mongoose=require("mongoose")
const DB="mongodb+srv://ranvishwakarma122:nNjOcMP7oTBVqWVK@cluster0.cbs5t.mongodb.net/bookmycoach"
const CollectionDB=async()=>{
    try {
        await mongoose.connect(DB)
        console.log("DB Connected to Server")
    } catch (error) {
        console.log("DB is not connect to Server")
    }
}
module.exports=CollectionDB
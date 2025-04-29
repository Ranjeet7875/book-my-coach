const mongoose=require("mongoose")
const UserScheme=new mongoose.Schema({
    name:{type:String,required:true},
    email:{type:String},
    password:{type:String}
})
const UserModel=mongoose.model("users",UserScheme)
module.exports=UserModel
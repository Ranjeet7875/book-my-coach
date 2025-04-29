const express=require("express")
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const UserModel = require("../models/user.model")
const router=express.Router()
router.post("/signup",async(req,res)=>{
    const {name,email,password}=req.body
    try {
        const userExit=await UserModel.findOne({email})
        if(userExit){
            return res.status(404).send("User already exists")
        }
        const hashpassword=await bcrypt.hash(password,10)
        const NewUser=new UserModel({name,email,password:hashpassword})
        NewUser.save()
        res.status(201).send({Message:"User SuccessFull Signup",NewUser})
    } catch (error) {
        console.log("Something wrong the body")
    }
})
router.post("/login",async(req,res)=>{
    const {email,password}=req.body
    try {
        const user=await UserModel.findOne({email})
        if(!user){
            return res.status(404).send("User not exits")
        }
        const ismatch=await bcrypt.compare(password,user.password)
        if(ismatch){
                const token=jwt.sign({userId:user._id},'your-secret-key')
            return res.status(200).send({Message:"User loggned Successfull",token})
        }

    } catch (error) {
        res.status(404).send("Data not fetched")
    }
})
module.exports=router
const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { User } = require("./models/User");
const {auth} = require('./middleware/auth');

const config = require("./config/key")


//application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));

//application/json
app.use(bodyParser.json());

app.use(cookieParser());

const mongoose = require('mongoose')
mongoose.connect(config.mongoURI,{
    useNewUrlParser: true, useUnifiedTopology: true
}).then(()=>console.log("MongoDB Connected"))
  .catch(err=>console.log(err))

app.get('/', (req, res) => {
  res.send('server request!')
})

app.post('/api/users/register', (req, res) => {
  //회원 가입할 때 필요 한 정보들을 client에서 가져오면 그 것들을 데이터 베이스에 넣어준다.
    
   const user = new User(req.body)

   user.save((err, userInfo) =>{
       if(err) return res.json({success: false, err})
       return res.status(200).json({
        success: true
       })
   })
})

app.post('/api/users/login', (req,res)=> {
    //요청된 이메일을 데이터베이스에서 있는지 찾기
    User.findOne({email: req.body.email}, (err, user)=>{
       if(!user){
         return res.json({
           loginSuccess: false,
           message: "제공된 이메일에 해당하는 유저가 없습니다."
         })
       }
 

        //  요청된 이메일이 데이터베이스에 있다면 비밀번호가 맞는 비밀번호인지 확인

         user.comparePassword(req.body.password , (err, isMatch) => {
            if(!isMatch)
            return res.json({loginSuccess: false, message: "비밀번호가 일치하지 않습니다."})

             //비밀번호가 맞다면 토큰을 생성
             user.genToken((err, user)=>{
              if(err) return res.status(400).send(err);
              //토큰을 저장한다
               res.cookie("x_auth",  user.token) 
              .status(200)
              .json({loginSuccess: true, userId: user._id})
             })
         })

    })
})

app.get('/api/users/auth', auth ,(req, res)=>{
      //미들웨어를 통과하면 Authentication이 True
      res.status(200).json({
        _id: req.user._id,
        isAdmin: req.user.roll === 0 ?false: true,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        lastname: req.user.lastname,
        role: req.user.role,
        image: req.user.image
      })
})

app.get('/api/users/logout', auth, (req, res)=>{
   User.findOneAndUpdate({_id: req.user._id}, {token: ''}, (err, user)=>{
     if(err) return res.json({success: false, err});
     return res.status(200).send({
       success: true
     })
   })
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


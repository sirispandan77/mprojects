var express=require('express');
var app=express();
const MongoClient=require('mongodb').MongoClient;
const url='mongodb://127.0.0.1/connected';
const dbName='hospitalInventory';
let db

//linking other files
let server=require('./server');
let config = require('./config');
let middleware = require('./middleware');

//including bodyParser
const bodyParser =require('body-parser');
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

//connecting mongo to nodejs
MongoClient.connect(url,(err,client)=>{
    if(err)
        return console.log("error is:"+ err);
    db=client.db(dbName);           //connects db to node

    console.log(`connected database: ${url}`);
    console.log(`database: ${dbName}`);
})



app.get('/hospdetails',middleware.checkToken, function(req,res){
    console.log("fetching data from hospital collection");
    var q=req.query.name;
    if(q)
        db.collection('hospital').find({'name':new RegExp(q,'i')}).toArray().then(result => res.json(result));
    else
        var data=db.collection('hospital').find({}).toArray().then(result => res.json(result));
});



app.get('/ventdetails',middleware.checkToken,function(req,res){
    console.log("fetching data from ventilators collection");
    var data=db.collection('ventilators');
    var x=req.query;
    var n=x.n;
    var q=x.status;
    var name=x.name;
    if(q && name){
        data.find({status:q, 'name':new RegExp(name,'i')}).toArray().then(result => {
            if (result.length!==0)
                res.json(result)
            else
                res.send("data not found");
            }) //both name and status
    }
    else if(q)
        data.find({status:q}).toArray().then(result => {
            if (result.length!==0)
                res.json(result)
            else
                res.send(`no ${q} ventilators`);
            })
    else if(name)
        data.find({'name':new RegExp(q=name,'i')}).toArray().then(result =>{
            if (result.length!==0)
                res.json(result)
            else
                res.send(`no ventilators in ${name} `);
            } )

    else
        data.find().toArray().then(result => res.json(result));
}
);



app.put('/ventdetails',middleware.checkToken,function(req,res){
    console.log("updating data of ventilators collection");
    var v={vId:req.body.vid};
    var status={$set: {status:req.body.status}};
    db.collection('ventilators').updateOne(v,status,function(err,res){
        console.log("updated");
    });
    //db.collection('ventilators').find().toArray().then(result => res.send(result));
    res.send("data updated");
});



app.post('/ventdetails',middleware.checkToken,function(req,res){
    console.log("adding data to ventilators collection");
    var v=req.body.vid;
    var status=req.body.status;
    console.log(v);
    var r=/^[H][0-9]/i;
    var h=v.match(r);
    var name;
    console.log(h[0]);
    db.collection('hospital').find({hId:h[0]},{projection:{ _id:0, name:1 }}).toArray().then(result => {
    var obj={hId:h[0],vId:v,status:status,name:result[0].name}
    db.collection('ventilators').insertOne(obj, function(err, res) {
        if (err) throw err;
        console.log("1 document inserted");
    });
    
});
    //db.collection('ventilators').find().toArray().then(result => res.send(result));
    res.send("data posted");
});



app.delete('/ventdetails',middleware.checkToken,function(req,res){
    console.log("deleting data of ventilators collection");
    var v={vId:req.query.vid};
    //console.log(v);
    var n=req.query.n;
    var flag;
    var d=db.collection('ventilators');
    d.find(v).toArray().then(result=>{ 
        flag=result.length
        
   // console.log(flag+ " flag line 133");
    if(flag>0){
        if(n!=='many' ){
        d.deleteOne(v, function(err, obj) {
            if (err) throw err;
            console.log("1 document deleted");
            });
        }
        else{
            db.collection('ventilators').deleteMany(v, function(err, obj) {
                if (err) throw err;
                console.log(obj.result.n+ " document deleted");
                });
        }
        db.collection('ventilators').find().toArray().then(result => res.send(result));
    }
    else
        res.send("no such ventilator exists.")
})
    
});
app.listen(3000);

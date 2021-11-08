const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const saltRounds = 3;

const connect = async (uri)=>{
    await mongoose.connect(uri, (err)=>{
        if(err){
            console.log(err)            
        }else{
            console.log("Database connection successful")
        }
        
    });
}

const likeSchema = new mongoose.Schema({
    stock: String,
    likes: Number,
    ip: [String]
});

const LikeData = mongoose.model('LikeData', likeSchema);

// Returns the stock found.
const findStock = async (stockName)=>{
    const result = await LikeData.findOne({stock: stockName});    
    return result;
}

// Returns true/false success status.
const addLikeToStock = async (stockName, ipAddress) => {
    
    const stock = await LikeData.findOne({stock: stockName});
    if(!stock){
        throw new Error("Stock does not exist.");        
    }

    // if user has already liked.
    for(let ipHash of stock.ip){
        let result = await bcrypt.compare(ipAddress, ipHash);
        if(result){
            return false;
        }
    }

    // If user has not liked already
    stock.likes += 1;
    stock.ip.push(await bcrypt.hash(ipAddress, saltRounds));
    
    await stock.save();
    return true;
}

const deleteStock = async (stockName) => {
    await LikeData.deleteOne({stock: stockName});
}

const addStock = async (stockName, like, ipAddress)=>{

    
    const stockData = {};
    stockData['stock'] = stockName;
    stockData['likes'] = 0;
    stockData['ip'] = [];
    if(like){

        let hashedIP = await bcrypt.hash(ipAddress, saltRounds)
        stockData['likes'] = 1;
        stockData['ip'] = [hashedIP];
    }

    const stock = new LikeData(stockData);
    await stock.save();
    return stock;
    
}

module.exports = {
    addStock,
    addLikeToStock,
    connect, 
    findStock,
    deleteStock
}
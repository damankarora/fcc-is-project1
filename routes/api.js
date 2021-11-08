'use strict';

const axios = require('axios');
const db = require('../database/db');


const operateStock = async (stock, like, ip)=>{
  const apiResponse = await axios.get(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`)
  const stockPrice = apiResponse.data.latestPrice;  
  
  const foundStock = await db.findStock(stock);
  
  // If DB is present
  if (foundStock) {
    if (like) {
      await db.addLikeToStock(stock, ip);
    }
    let result = await db.findStock(stock);

    return {
      stock,
      price: stockPrice,
      likes: result.likes
    };
  }

  // if stock is not present in our DB.
  
  
  let result = await db.addStock(stock, like, ip);
  return {    
    stock,
    price: stockPrice,
    likes: result.likes    
  };
}

module.exports = function (app) {


  // endpoint
  app.route('/api/stock-prices')
    .get(async function (req, res){
      let { stock, like } = req.query;
      like = like === 'true';
      

      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      
      // if single stock is present.
      if(!Array.isArray(stock)){
        let data = await operateStock(stock, like, ip);
        return res.json({stockData: {...data}});
      }

      // If multiple stocks (2) are present.

      const firstStock = stock[0];
      const secondStock = stock[1];

      let firstResult = await operateStock(firstStock, like, ip);
      let secondResult = await operateStock(secondStock, like, ip);
      firstResult["rel_likes"] = firstResult.likes - secondResult.likes;
      secondResult["rel_likes"] = firstResult["rel_likes"] * (-1);
      
      delete firstResult.likes;
      delete secondResult.likes;
      return res.json({stockData: [{...firstResult}, {...secondResult}]});
    });
    
};

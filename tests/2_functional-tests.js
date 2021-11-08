const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

const db = require('../database/db');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    this.timeout(5000);
    test('Viewing one stock', (done)=>{
        chai.request(server)
        .get('/api/stock-prices/')
        .query({
            stock: 'GOOG'
        })
        .end((err, res)=>{
            if(err){
                fail(err);
            }
            assert.equal(res.status, 200);
            assert.property(res.body, "stockData");
            assert.property(res.body.stockData, "stock");
            assert.property(res.body.stockData, "price");
            assert.property(res.body.stockData, "likes");
            done();
        })
    })

    suite('Liking a stock', ()=>{
        this.beforeAll((done)=>{
            db.addStock("customStock").then(()=>{
                done();
            })
        });

        test("Liking an already existing stock.",function (done){
            chai.request(server)
            .get('/api/stock-prices/')
            .query({
                stock: "customStock",
                like: true
            })
            .end((err, res)=>{
                if(err){
                    fail(err);
                }
                assert.equal(res.status, 200);
                assert.property(res.body.stockData, "likes");
                assert.equal(res.body.stockData.likes, 1);
                done();
            })
        })

        this.afterAll((done)=>{
            db.deleteStock("customStock").then(()=>{
                done();
            })
        })
    });

    suite('Liking an new stock',function (){
        this.afterAll((done)=>{
            db.deleteStock("ourNewStock")
            .then(()=>{
                done();
            }).catch((err)=>{
                fail(err);
            })
        })
        
        test("Liking while creating", (done) => {
            chai.request(server)
                .get('/api/stock-prices/')
                .query({
                    stock: "ourNewStock",
                    like: true
                })
                .end((err, res)=>{
                    if(err){
                        fail(err);
                    }
                    assert.equal(res.status, 200);
                    assert.property(res.body.stockData, "likes");
                    assert.equal(res.body.stockData.likes, 1);
                    done();
                })
        })
        
    });

    suite('Viewing the same stock and liking it again',function (){
        this.beforeAll((done)=>{
            chai.request(server)
                .get('/api/stock-prices/')
                .query({
                    stock: "ourNewStock",
                    like: true
                })
                .end((err, res) => {
                    if (err) {
                        fail(err);
                    }
                    assert.equal(res.status, 200);
                    assert.property(res.body.stockData, "likes");
                    assert.equal(res.body.stockData.likes, 1);
                    done();
                })            
        })

        test('Liking already existing stock', (done)=>{
            chai.request(server)
                .get('/api/stock-prices/')
                .query({
                    stock: "ourNewStock",
                    like: true
                })
                .end((err, res) => {
                    if (err) {
                        fail(err);
                    }
                    assert.equal(res.status, 200);
                    assert.property(res.body.stockData, "likes");
                    assert.equal(res.body.stockData.likes, 1);
                    done();
                })
        })
        this.afterAll((done) => {
            db.deleteStock("ourNewStock")
                .then(() => {
                    done();
                }).catch((err) => {
                    fail(err);
                })
        })
    })

    test("Viewing two stocks", (done)=>{
        chai.request(server)
            .get('/api/stock-prices/')
            .query({
                stock: ["GOOG", "MSFT"],                
                like: true
            })
            .end((err, res) => {                
                if (err) {
                    fail(err);
                }
                assert.equal(res.status, 200);
                assert.isArray(res.body.stockData);
                assert.equal(res.body.stockData.length, 2);
                done();
            })
    });

    suite("Liking two stocks", function (){
        this.beforeAll(async ()=>{
            await db.addStock("custom1");
            await db.addStock("custom2");
            
        });

        test("Liking two stocks while viewing.", (done)=>{
            chai.request(server)
                .get('/api/stock-prices/')
                .query({
                    stock: ["custom1", "custom2"],
                    like: true
                })
                .end((err, res) => {
                    if (err) {
                        fail(err);
                    }
                    assert.equal(res.status, 200);
                    assert.isArray(res.body.stockData);
                    assert.equal(res.body.stockData.length, 2);
                    assert.equal(res.body.stockData[0]["rel_likes"], 0);
                    assert.equal(res.body.stockData[1]["rel_likes"], 0);
                    done();
                });
        });

        this.afterAll(async ()=>{
            await db.deleteStock('custom1');
            await db.deleteStock('custom2');
            
        })
    })


});

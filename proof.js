let express = require("express");
let app = express();
let server = require("http").createServer(app);
let io = require("socket.io")(server);
server.listen(8080);

app.use(express.static("public"));

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/public/html/index.html");
});

let Web3 = require("web3");
let web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
let proofContract = web3.eth.contract([{"constant":false,
    "inputs":[{"name":"fileHash","type":"string"}],"name":"get","outputs":
    [{"name":"timestamp","type":"uint256"},{"name":"owner","type":"string"}],
    "payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"owner","type":"string"},
    {"name":"fileHash","type":"string"}],"name":"set","outputs":[],"payable":false,"type":"function"},
    {"anonymous":false,"inputs":[{"indexed":false,"name":"status","type":"bool"},
    {"indexed":false,"name":"timestamp","type":"uint256"},
    {"indexed":false,"name":"owner","type":"string"},
    {"indexed":false,"name":"fileHash","type":"string"}],
    "name":"logFileAddedStatus","type":"event"}]);

let proof = proofContract.at("0x4eda0f8e2aff3275109e332862a2f27a044a740f");

app.get("/submit", function(req, res) {
    let fileHash = req.query.hash;
    let owner = req.query.owner;
    proof.set.sendTransaction(owner, fileHash, {
        from: web3.eth.accounts[0]
    }, function(error, transactionHash) {
        if(!error) {
            res.send(transactionHash);
        } else {
            res.send("Error");
        }
    });
});

app.get("/getInfo", function(req, res) {
    let fileHash = req.query.hash;
    let details = proof.get.call(fileHash);
    res.send(details);
});

proof.logFileAddedStatus().watch(function(error, result) {
    if(!error) {
        if(result.args.status === true) {
            io.send(result);
        }
    }
});
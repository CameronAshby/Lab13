const net = require('net');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let client = net.createConnection({port: 5000}, () => {
    client.on('data', (data) => {
        if(data.toString() === 'destroy') {
            process.exit();
        }
        else {
            console.log(data.toString());
        }
    });

    rl.on('line', (input) => {
        if(input === 'exit') {
            console.log('Now exiting program\n');
            client.destroy();
            process.exit();
        }
        else {
            client.write(input);
        }
    });
});

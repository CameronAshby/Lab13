const net = require('net');
const fs = require('fs');

let writeStream = fs.createWriteStream('./serverChat.log');

let clientCounter = 1;
let clientArray = [];

function messageEveryone(client, message) {
    writeStream.write(`${client.username}: ${message} \n`);
    clientArray.forEach( (clientSocket) => {
        if(clientSocket.username === client.username) {
            return;
        }
        else {
            clientSocket.write(`${client.username}: ${message} \n`);
        }
    });
}

function whisper(client, receiveClient, message) {
    let found = false;
    if(client.username === receiveClient) {
        client.write('You cannot whisper to yourself.\n');
    }
    else {
        clientArray.forEach((clientSocket) => {

            if(clientSocket.username === receiveClient) {
                let newMessage = '';
                message.forEach((word) => {
                    newMessage += (word + ' ');
                });

                clientSocket.write(`${client.username} whispers: ${newMessage}\n`);
                console.log(`${client.username} whispers: ${newMessage} to ${receiveClient}`);
                writeStream.write(`${client.username} whispers: ${newMessage} to ${receiveClient}\n`);
                found = true;
            }
        });
        if(!found) {
            client.write('username does not exist\n');
        }
    }
}

function changeUsername(client, newUsername) {
    let found = false;
    clientArray.forEach((clientSocket) => {
        if(clientSocket.username === newUsername) {
            found = true;
        }
    });
    if(found) {
        client.write(`Username already in use\n`);
    }
    else {
        if(client.username === newUsername) {
            client.write('You cannot change to the same username.\n');
        }
        else {
            console.log(`${client.username} changed their username to ${newUsername}\n`);
            messageEveryone(client, `Changed their username to ${newUsername}`);
            client.username = newUsername;
        }
    }
}

function kickClient(client, kickUser, password) {
    let found = false;
    if(client.username === kickUser) {
        client.write('You cannot kick yourself from the chat.\n');
    }
    else {
        if(password === 'kick') {
            clientArray.forEach((clientSocket) => {
                if(clientSocket.username === kickUser) {
                    clientSocket.write('You have been kicked from the server');
                    clientArray.forEach((clientSocket, index) => {
                        if (clientSocket.username === kickUser) {
                            clientArray.splice(index, 1);
                        }
                    });
                    clientSocket.write('destroy');
                    clientSocket.destroy();
                    messageEveryone(client, `${kickUser} was kicked from the chat.`);
                    console.log(`${kickUser} was kicked from the chat.`);
                    found = true;
                }
            });
            if(!found) {
                client.write('username does not exist');
            }
        }
        else {
            client.write('Incorrect password')
        }
    }
}

function displayClients(client) {
    let clientList = '';
    clientArray.forEach((serverClient) => {
        clientList += (`${serverClient.username}, `);
    });
    client.write(clientList);
}

let server = net.createServer(client => {

    client.username = `Client${clientCounter}`;
    clientArray.push(client);
    clientCounter++;

    console.log(`${client.username} Connected \n`);
    messageEveryone(client, 'Joined the chat');

    client.write(`Welcome ${client.username}! Start typing to chat. Type /help for commands. Type exit to leave.\n`);

    client.on('data', (data) => {

        if(data[0].toString() === '47') {
            let commandArray = data.toString().split(' ');
            if(commandArray[0] === '/w' && commandArray.length >= 3) {
                whisper(client, commandArray[1], commandArray.slice(2,commandArray.length));
            }
            else if(commandArray[0] === '/username' && commandArray.length === 2) {
                changeUsername(client, commandArray[1]);
            }
            else if(commandArray[0] === '/kick' && commandArray.length === 3) {
                kickClient(client, commandArray[1], commandArray[2]);
            }
            else if(commandArray[0] === '/clientList' && commandArray.length === 1) {
                displayClients(client);
            }
            else if(commandArray[0] === '/help') {
                client.write(`
                    /w [clientName] [message] (whisper to client)\n
                    /username [username] (changes username)\n
                    /kick [clientName] [password] (removes client from chat, password is kick)\n
                    /clientList (display all clients in chat)\n
                `);
            }
            else {
                client.write('Invalid command. Type /help for a list of valid commands');
            }
        }
        else {
            console.log(`${client.username}: ${data} \n`);
            messageEveryone(client, data);
        }
    });

    client.on('close', () => {
        console.log(`${client.username} left the chat\n`);

        clientArray.forEach((clientSocket, index) => {
            if (clientSocket.username === client.username) {
                clientArray.splice(index, 1);
            }
        });

        messageEveryone(client, 'Left the chat');
    })

}).listen(5000);

console.log('Listening on port 5000.\n');

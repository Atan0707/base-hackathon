import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import LEDQuadraticVoting from '../../contract/LEDQuadraticVoting.json'

const contractABI = LEDQuadraticVoting.abi; 
const contractAddress = "0xB024AB06A8c64684EE44fE78904edb29e02862f6";
const rpcURL = "https://sepolia.base.org";

function QuadraticVoting() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [voteEndTime, setVoteEndTime] = useState(null);
  const [currentBlockTimestamp, setCurrentBlockTimestamp] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [cycleStatus, setCycleStatus] = useState(null);
  const [blueVotes, setBlueVotes] = useState(0);
  const [redVotes, setRedVotes] = useState(0);
  const [greenVotes, setGreenVotes] = useState(0);
  const [timeBlue, setTimeBlue] = useState(0);
  const [timeRed, setTimeRed] = useState(0);
  const [timeGreen, setTimeGreen] = useState(0);
  const [votes, setVotes] = useState({ blue: 0, red: 0, green: 0 });
  const [votesLeft, setVotesLeft] = useState(10);

  useEffect(() => {
    getTime();
    getCurrentStatus();
    getResult();

    const timer = setInterval(() => {
      getTime();
      getCurrentStatus();
      getResult();
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        // const address = await signer.getAddress();
        setAccount(accounts[0]);

        const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
        setContract(contractInstance);
      } catch (error) {
        console.error("Fail to connect wallet: ", error);
      }
    }
  }

  const handleVote = async () => {
    if (!contract) return;
    try {
      const tx = await contract.vote(votes.red, votes.green, votes.blue);
      await tx.wait();
      alert("Vote submitted successfully!");
    } catch (error) {
      console.error("Error voting:", error);
      alert("Countdown ended. Reset to vote.");
    }
  };

  const getTime = async () => {
    const provider = new ethers.JsonRpcProvider(rpcURL);
    const contractInstance = new ethers.Contract(contractAddress, contractABI, provider);
    const time = await contractInstance.cycleEndTime();
    setVoteEndTime(time.toString());
    const latestBlock = await provider.getBlock('latest');
    const blockTimestamp = BigInt(latestBlock.timestamp);
    setCurrentBlockTimestamp(blockTimestamp.toString());
    // console.log("Current time: ", time.toString());
    // console.log("Current block timestamp: ", blockTimestamp.toString());
    
    const timeRemaining = BigInt(Math.max(0, Number(time - blockTimestamp)));
    setTimeRemaining(timeRemaining.toString());
    // console.log("Time remaining: ", timeRemaining.toString());
  }

  const getCurrentStatus = async () => {
    const provider = new ethers.JsonRpcProvider(rpcURL);
    const contractInstance = new ethers.Contract(contractAddress, contractABI, provider);
    const status = await contractInstance.isCycleEnded();
    setCycleStatus(status);
  }

  const calculateResult = async () => {
    if (!contract) return;
    try {
      const result = await contract.getResult();
      await result.wait();
      alert("Result calculated successfully!");
      console.log("Result: ", result);
    } catch (error) {
      console.error("Failed to calculate result: ", error);
    }
  }

  const getResult = async () => {
    const provider = new ethers.JsonRpcProvider(rpcURL);
    const contractInstance = new ethers.Contract(contractAddress, contractABI, provider);
    const blueVotes = await contractInstance.voteBLUE();
    const redVotes = await contractInstance.voteRED();
    const greenVotes = await contractInstance.voteGREEN();
    setBlueVotes(blueVotes.toString());
    setRedVotes(redVotes.toString());
    setGreenVotes(greenVotes.toString());

    let timeBlue = await contractInstance.timeBLUE();
    let timeRed = await contractInstance.timeRED();
    let timeGreen = await contractInstance.timeGREEN();
    const toSeconds = (bigNumber) => (parseFloat(ethers.formatUnits(bigNumber, 18)).toFixed(2)) / 1e18;
    timeBlue = toSeconds(timeBlue);
    timeRed = toSeconds(timeRed);
    timeGreen = toSeconds(timeGreen);
    
    setTimeBlue(timeBlue.toString());
    setTimeRed(timeRed.toString());
    setTimeGreen(timeGreen.toString());

    // Send the time values to the Express server
    try {
      const response = await fetch('https://base-hackathon-api.vercel.app/updateTimes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timeBlue, timeRed, timeGreen }),
      });
      if (!response.ok) {
        throw new Error('Failed to update times on server');
      }
    } catch (error) {
      console.error('Error updating times:', error);
    }
  }

  const handleVoteChange = (color, value) => {
    const newValue = Math.max(0, Math.min(value, votesLeft + votes[color]));
    const newVotes = { ...votes, [color]: newValue };
    const totalVotes = Object.values(newVotes).reduce((sum, v) => sum + v, 0);
    setVotes(newVotes);
    setVotesLeft(10 - totalVotes);
  };

  const resetVote = async () => {
    if (!contract) return;
    await contract.reset();
    await contract.reset().wait();
    alert("Vote reset successfully!");
  }

  return (
    <div className='min-h-screen bg-gray py-6 flex flex-col justify-center'>
      <h1 className='text-center text-4xl font-bold text-gray-900'>Quadratic Voting Simulator</h1>
      {!account ? (
        <button onClick={connectWallet} className='mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mx-auto'>Connect Wallet</button>
      ) : (
        <div className="items-center">
          <div className="account flex justify-center">
            <p className="mb-4 text-sm text-gray-600">Connected Account: <span className="font-mono">{account}</span></p>
          </div>
          <div className="status flex justify-center">
            <p className="mb-4 text-sm text-gray-600">
              Cycle Status: 
              <span className={`font-mono ${cycleStatus ? "text-red-600" : "text-green-600"}`}>
                {cycleStatus ? " Ended" : " Open"}
              </span>
            </p>
          </div>
          <div className="time flex justify-center">
            <p className="mb-4 text-sm text-gray-600">Time Remaining: <span className="font-mono">{timeRemaining}</span></p>
          </div>
          <div className="vote mb-6 flex flex-col items-center">
            <h2 className="text-2xl font-semibold mb-2 text-gray-700 text-center">Vote</h2>
            <div className="flex justify-center space-x-4 mb-4">
              {['red', 'green', 'blue'].map((color) => (
                <div key={color} className="flex flex-col items-center">
                  <label htmlFor={`${color}-vote`} className="mb-1 text-gray-700 capitalize">{color}:</label>
                  <input
                    id={`${color}-vote`}
                    type="number"
                    value={votes[color]}
                    onChange={(e) => handleVoteChange(color, parseInt(e.target.value) || 0)}
                    min="0"
                    max={votesLeft + votes[color]}
                    className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-24"
                  />
                </div>
              ))}
            </div>
            <div className="vote-left">
              <p className="text-sm text-gray-600">Votes left: <span className="font-bold">{votesLeft}</span></p>
            </div>
            <button 
              onClick={handleVote} 
              className="mt-4 hover:text-blue-900 hover:border-blue-900 duration-100 text-black font-bold py-2 px-4 rounded border border-black mx-auto"
              disabled={votesLeft !== 0}
            >
              Submit Vote
            </button>
          </div>
          <div className="calculate-result flex justify-center m-2">
            <button onClick={calculateResult} className=' hover:text-blue-900 hover:border-blue-900 duration-100 text-amber-900 font-bold py-2 px-4 rounded border border-black mx-auto'>Calculate Result</button>
          </div>
          <div className="result flex flex-col items-center">
            <h2 className="text-center font-bold text-gray-900 mb-2">Quadratic Voting Result (Quadratic Voting applied)</h2>
            <div className="flex justify-center gap-4">
              <p className="mb-2 text-sm text-gray-600">Blue Votes: <span className="font-mono">{blueVotes}</span></p>
              <p className="mb-2 text-sm text-gray-600">Red Votes: <span className="font-mono">{redVotes}</span></p>
              <p className="mb-2 text-sm text-gray-600">Green Votes: <span className="font-mono">{greenVotes}</span></p>
            </div>
            
          </div>
          <div className="time-distribution flex flex-col items-center">
            <h2 className="text-center font-bold text-gray-900 mb-2">Time Distribution</h2>
            <h3 className=" text-xs text-center font-bold text-gray-600 ">QV/QF Formula</h3>
            <p className="text-xs text-gray-600">M * (Σ√Vi)</p>
            <p className="text-xs text-gray-500 mt-1">Where:</p>
            <p className="text-xs text-gray-500">M = Matching Pool</p>
            <p className="text-xs text-gray-500">Vi = Votes for each project</p>
            <div className="flex justify-center gap-4 mt-2">
              <p className="text-sm text-gray-600">Blue: <span className="font-mono">{timeBlue} seconds</span></p>
              <p className="text-sm text-gray-600">Red: <span className="font-mono">{timeRed} seconds</span></p>
              <p className="text-sm text-gray-600">Green: <span className="font-mono">{timeGreen} seconds</span></p>
            </div>
          </div>
          <div className="reset flex justify-center">
            <button onClick={resetVote} className='mt-4 hover:text-blue-900 hover:border-blue-900 duration-100 text-black font-bold py-2 px-4 rounded border border-black mx-auto'>Reset</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuadraticVoting;

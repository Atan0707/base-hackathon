import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import LEDQuadraticVoting from '../../contract/LEDQuadraticVoting.json'

const contractABI = LEDQuadraticVoting.abi; 
const contractAddress = "0xB024AB06A8c64684EE44fE78904edb29e02862f6";

function QuadraticVoting() {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [votes, setVotes] = useState({ red: 0, green: 0, blue: 0 });
  const [results, setResults] = useState({ red: 0, green: 0, blue: 0 });
  const [cycleEnded, setCycleEnded] = useState(false);
  const [cycleEndTime, setCycleEndTime] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    connectWallet();
  }, []);

  useEffect(() => {
    if (contract) {
      getCycleEndTime();
      checkCycleStatus();
      getResults(); // Get initial results

      const timer = setInterval(() => {
        updateTimeRemaining();
        checkCycleStatus();
        setTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            setCycleEnded(true);
            clearInterval(timer);
            return 0;
          }
          return prevTime - 1;
        });
        getResults(); // Update results every second
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [contract]);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = await new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);

        const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
        setContract(contractInstance);
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    }
  };

  const handleVote = async () => {
    if (!contract) return;
    try {
      const tx = await contract.vote(votes.red, votes.green, votes.blue);
      await tx.wait();
      alert("Vote submitted successfully!");
    } catch (error) {
      console.error("Error voting:", error);
      alert("Error voting. Check console for details.");
    }
  };

  const calculateResult = async () => {
    const result = await contract.getResult();
  }
  const getResults = async () => {
    if (!contract) return;
    try {
      // const result = await contract.getResult();
      const red = await contract.timeRED();
      const green = await contract.timeGREEN();
      const blue = await contract.timeBLUE();
      
      // Convert the results from wei to seconds
      const toSeconds = (bigNumber) => (parseFloat(ethers.formatUnits(bigNumber, 18)).toFixed(2)) / 1e18;
      
      setResults({
        red: toSeconds(red),
        green: toSeconds(green),
        blue: toSeconds(blue)
      });
      console.log(red);
    } catch (error) {
      console.error("Error getting results:", error);
    }
  };

  const resetCycle = async () => {
    if (!contract) return;
    try {
      const tx = await contract.reset();
      await tx.wait();
      alert("Voting cycle reset successfully!");
      setCycleEnded(false);
      getCycleEndTime();
      setTimeRemaining(60);
    } catch (error) {
      console.error("Error resetting cycle:", error);
      alert("Error resetting cycle. Check console for details.");
    }
  };

  const getCycleEndTime = async () => {
    if (!contract) return;
    try {
      const endTime = await contract.cycleEndTime();
      setCycleEndTime(endTime);
    } catch (error) {
      console.error("Error getting cycle end time:", error);
    }
  };

  const updateTimeRemaining = () => {
    if (cycleEndTime) {
      const now = Math.floor(Date.now() / 1000);
      const remaining = cycleEndTime - now;
      setTimeRemaining(remaining > 0 ? remaining : 0);
    }
  };

  const checkCycleStatus = async () => {
    if (!contract) return;
    try {
      const ended = await contract.isCycleEnded();
      setCycleEnded(ended);
    } catch (error) {
      console.error("Error checking cycle status:", error);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <h1 className="text-4xl font-bold mb-5 text-center text-gray-800">LED Quadratic Voting</h1>
          {!account ? (
            <button onClick={connectWallet} className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300">Connect Wallet</button>
          ) : (
            <>
              <p className="mb-4 text-sm text-gray-600">Connected Account: <span className="font-mono">{account}</span></p>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2 text-gray-700">Voting Cycle</h2>
                <p className="text-gray-600">Time Remaining: <span className="font-bold">{timeRemaining !== null ? formatTime(timeRemaining) : 'Loading...'}</span></p>
                <p className="text-gray-600">Cycle Status: <span className={`font-bold ${cycleEnded ? 'text-red-600' : 'text-green-600'}`}>{cycleEnded ? 'Ended' : 'Active'}</span></p>
              </div>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2 text-gray-700">Vote</h2>
                <div className="space-y-4 mb-4">
                  {['red', 'green', 'blue'].map((color) => (
                    <div key={color} className="flex flex-col">
                      <label htmlFor={`${color}-vote`} className="mb-1 text-gray-700 capitalize">{color}:</label>
                      <input
                        id={`${color}-vote`}
                        type="number"
                        value={votes[color]}
                        onChange={(e) => setVotes({ ...votes, [color]: parseInt(e.target.value) })}
                        placeholder={`${color.charAt(0).toUpperCase() + color.slice(1)} votes`}
                        className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
                <button onClick={handleVote} disabled={cycleEnded} className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                  Vote
                </button>
              </div>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2 text-gray-700">Results</h2>
                <button onClick={calculateResult} className="w-full py-2 px-4 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition duration-300 mb-2">
                  Get Results
                </button>
                <div className="grid grid-cols-3 gap-2">
                  {['red', 'green', 'blue'].map((color) => (
                    <div key={color} className={`p-2 rounded-md bg-${color}-100 text-${color}-800`}>
                      <p className="font-semibold">{color.charAt(0).toUpperCase() + color.slice(1)}</p>
                      <p>{results[color]} seconds</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-2 text-gray-700">Reset Cycle</h2>
                <button onClick={resetCycle} disabled={!cycleEnded} className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                  Reset Voting Cycle
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuadraticVoting;

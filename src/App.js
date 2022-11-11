import './App.css';
import Header from './components/header/Header';
import MyClaim from './components/MyClaims/MyClaim';
import KingOfTheFoolsHistory from './components/KingOfTheFoolsHistory/KingOfTheFoolsHistory';
import { useState, useEffect } from 'react'
import Footer from './components/Footer/Footer';
import { ethers, utils, Contract } from 'ethers';
import { formatEther, randomBytes } from 'ethers/lib/utils';
import { defaultAbiCoder } from 'ethers/lib/utils';
import usdcTokenAbi from './utils/web3/usdc.json'
import kingOfTheFoolsAbi from './utils/web3/kingOfTheFools.json'
import priceAggregatorAbi from './utils/web3/priceAggregator.json'
import { formatUnits, hexlify, parseUnits } from 'ethers/lib/utils';
import { CURRENCY_ETH } from './constants';

const USDC_TOKEN_ADDRESS = "0x07865c6E87B9F70255377e024ace6630C1Eaa37F";
const KING_OF_THE_FOOLS_ADDRESS = "0x4dA28Ff81bB435E221c6743471d813b207D28386";
const PRICE_AGGREGATOR_ADDRESS = "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e";

const CHAIN_ID = 5; // Goerli testnet

function App() {

  // a flag for keeping track of whether or not a user is connected
  const [connected, setConnected] = useState(false);

  // connected user details
  const [userInfo, setUserInfo] = useState({
    eth_balance: 0,
    usdc_balance: 0,
    address: null
  });


  // the amount of eth claim the user has accumulated
  const [ethClaim, setETHClaim] = useState(null)

  // the amount of usdc claim the user has accumulated
  const [usdcClaim, setUSDCClaim] = useState(null)

  // the value of USDC the user wants to deposit
  const [usdcInput, setUSDCInput] = useState("");

  // the value of ETH the user wants to deposit
  const [ethInput, setETHInput] = useState("");

  // all king of the fools history data displayed on the history table
  const [kingOfTheFoolsHistory, setKingOfTheFoolsHistory] = useState([]);

  const [contractOwner, setContractOwner] = useState("");
  const [noClaim, setNoClaim] = useState(true);
  const [usdPerETH, setUsdPerETH] = useState(null);
  const [rateUpdatedAt, setRateUpdatedAt] = useState(null);
  const [highestDeposit, setHighestDeposit] = useState(null);
  const [highestDepositCurrency, setHighestDepositCurrency] = useState(null);
  const [nextETHDeposit, setNextETHDeposit] = useState(null);
  const [nextUSDCDeposit, setNextUSDCDeposit] = useState(null);






  // helper function for getting the ETH and USDC balance, given an address
  const getAccountDetails = async (address) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const userETHBalance = await provider.getBalance(address.toString());

      const usdcContractInstance = new Contract(USDC_TOKEN_ADDRESS, usdcTokenAbi, provider);

      const userUSDCBalance = await usdcContractInstance.balanceOf(address);

      const kingOfTheFoolsContractInstance = new Contract(KING_OF_THE_FOOLS_ADDRESS, kingOfTheFoolsAbi, provider);


      // Get user Claims
      const userClaims = await kingOfTheFoolsContractInstance.pendingClaims(address);



      return { userUSDCBalance, userETHBalance, userUsdcClaim: utils.formatUnits(userClaims[0], 6), userETHClaim: utils.formatEther(userClaims[1]) };
    } catch (err) {
      console.log(err)
    }
  }

  // handler for when user switch from one account to another or completely disconnected
  const handleAccountChanged = async (accounts) => {
    if (!!accounts.length) {
      const networkId = await window.ethereum.request({ method: "eth_chainId" })
      if (Number(networkId) !== CHAIN_ID) return
      const accountDetails = await getAccountDetails(accounts[0])
      const account = accounts[0];
      setUserInfo({
        eth_balance: accountDetails.userETHBalance,
        usdc_balance: accountDetails.userUSDCBalance,
        address: account.toString()
      })
      setETHClaim(accountDetails.userETHClaim);
      setUSDCClaim(accountDetails.userUsdcClaim);
      setConnected(true)
      setNoClaim(+accountDetails.userETHClaim === 0 && +accountDetails.userUsdcClaim === 0);
    } else {
      setConnected(false)
      setUserInfo({
        eth_balance: 0,
        usdc_balance: 0,
        address: null
      })
      setETHClaim(0);
      setUSDCClaim(0);
      setNoClaim(true);
    }
  }

  // handler for handling chain/network changed
  const handleChainChanged = async (chainid) => {
    if (Number(chainid) !== CHAIN_ID) {

      alert("You are connected to the wrong network, please switch to Goerli testnet")

      setConnected(false)
      setUserInfo({
        eth_balance: 0,
        usdc_balance: 0,
        address: null
      })
      setETHClaim(0);
      setUSDCClaim(0);

      return;

    } else {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (!accounts.length) return

      const account = accounts[0]
      const accountDetails = await getAccountDetails(account)
      setUserInfo({
        eth_balance: accountDetails.userETHBalance,
        usdc_balance: accountDetails.userUSDCBalance,
        address: account
      })
      setETHClaim(accountDetails.userETHClaim);
      setUSDCClaim(accountDetails.userUsdcClaim);
      setConnected(true)
      setNoClaim(+accountDetails.userETHClaim === 0 && +accountDetails.userUsdcClaim === 0);
    }

  }

  // an handler to eagerly connect user and fetch their data
  const eagerConnect = async () => {
    const networkId = await window.ethereum.request({ method: "eth_chainId" })
    if (Number(networkId) !== CHAIN_ID) return
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await provider.listAccounts();
    if (!accounts.length) return
    const account = accounts[0];
    const accountDetails = await getAccountDetails(account)
    setUserInfo({
      eth_balance: accountDetails.userETHBalance,
      usdc_balance: accountDetails.userUSDCBalance,
      address: account.toString()
    })
    setETHClaim(accountDetails.userETHClaim);
    setUSDCClaim(accountDetails.userUsdcClaim);
    setConnected(true);
    setNoClaim(+accountDetails.userETHClaim === 0 && +accountDetails.userUsdcClaim === 0);

  }

  // a function for fetching necesary data from the contract and also listening for contract event when the page loads
  const init = async () => {
    const customProvider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_RPC_URL)
    const kingOfTheFoolsContractInstance = new Contract(KING_OF_THE_FOOLS_ADDRESS, kingOfTheFoolsAbi, customProvider);
    const kingOfTheFoolsHistory = await kingOfTheFoolsContractInstance.queryFilter("NewKingOfTheFools");

    const history = [];

    kingOfTheFoolsHistory.forEach(data => {
      history.unshift({
        kingOfTheFools: data.args[0],
        deposit: data.args[1],
        currency: data.args[2].toNumber(),
        time: data.args[3].toString(),
      })
    })
    setKingOfTheFoolsHistory(history);


    setHighestDeposit(await  kingOfTheFoolsContractInstance.highestDeposit());
    const currencyOfHighestDeposit = await  kingOfTheFoolsContractInstance.currencyOfHighestDeposit();
    setHighestDepositCurrency(Number(currencyOfHighestDeposit));



    kingOfTheFoolsContractInstance.on("NewKingOfTheFools", (kingOfTheFools, deposit, currency, time) => {
      const newKingOfTheFools = {
        kingOfTheFools,
        deposit,
        currency: currency.toNumber(),
        time: time.toString(),
      }

      setKingOfTheFoolsHistory(prev => [newKingOfTheFools, ...prev]);
      setHighestDeposit(newKingOfTheFools.deposit)
      setHighestDepositCurrency(newKingOfTheFools.currency)
    })

    // set contract owner
    const owner = await kingOfTheFoolsContractInstance.owner();
    setContractOwner(owner);
    // set exchange rate
    const priceAggregatorContractInstance = new Contract(PRICE_AGGREGATOR_ADDRESS, priceAggregatorAbi, customProvider);
    const latestRound = await priceAggregatorContractInstance.latestRoundData();
    const usdPerETH = Number(latestRound[1]) / 10 ** 8;
    setUsdPerETH(usdPerETH);
    setRateUpdatedAt(latestRound[3].toString());


    priceAggregatorContractInstance.on("AnswerUpdated", (current, round, updatedAt) => {
      setUsdPerETH(Number(current) / 10 ** 8);
      setRateUpdatedAt(updatedAt.toString());
    })

  }

  useEffect(() => {

    init()
    if (!window.ethereum) return;
    // binding handlers to wallet events we care about
    window.ethereum.on("connect", eagerConnect)
    window.ethereum.on("accountsChanged", handleAccountChanged)
    window.ethereum.on('chainChanged', handleChainChanged);
  }, []);


  useEffect(() => {
    if (highestDeposit != null && usdPerETH != null && highestDepositCurrency != null) {
      if (highestDepositCurrency === CURRENCY_ETH) {
        const etherDeposit = Number(formatEther(highestDeposit).toString());
        setNextETHDeposit(etherDeposit * 1.5);
        setNextUSDCDeposit(usdPerETH * etherDeposit * 1.5);
      } else {
        const usdcDeposit = Number(formatUnits(highestDeposit.toString(), 6));
        setNextUSDCDeposit(usdcDeposit * 1.5);
        setNextETHDeposit((usdcDeposit / usdPerETH) * 1.5);
      }
    }
  }, [usdPerETH, highestDeposit, highestDepositCurrency]);


  const connectWallet = async () => {
    if (!!window.ethereum || !!window.web3) {
      await window.ethereum.request({ method: "eth_requestAccounts" })
    } else {
      alert("please use an etherum enabled browser");
    }
  }

  // onchange handler for handling both USDC deposit and ETH deposit input value
  const onChangeInput = ({ target }) => {
    switch (target.id) {
      case "USDC":
        setUSDCInput(target.value)
        break;

      case "ETH":
        setETHInput(target.value);
        break;

      default:
        break;
    }
  }

  // A function that handles deposit of ETH
  const onClickDepositETH = async (e) => {
    e.preventDefault()
    if (+userInfo.eth_balance < ethInput) return alert("Insufficient Balance");
    if (ethInput <= 0) return alert("you cannot deposit less than or equals 0 ETH")

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await provider.listAccounts();
    if (!accounts.length) return;
    const account = accounts[0];

    const signer = provider.getSigner();
    const kingOfTheFoolsContractInstance = new Contract(KING_OF_THE_FOOLS_ADDRESS, kingOfTheFoolsAbi, signer);

    const currentKing = await kingOfTheFoolsContractInstance.kingOfTheFools();
    if (currentKing === account.toString()) return alert("You are the current king! are you trying to overthrow yourself?");
    const weiValue = utils.parseEther(ethInput);

    try {
      const depositTx = await kingOfTheFoolsContractInstance.depositETH({ value: weiValue });

      await provider.getTransaction(depositTx.hash)
      depositTx.wait();
    } catch (e) {
      return alert("Insufficient Deposit")
    }


    // Get new balances
    await getAccountDetails(account);

  }

  // A function that handles deposit of USDC
  const onClickDepositUSDC = async (e) => {
    e.preventDefault()
    if (usdcInput <= 0) return alert("you cannot deposit less than or equals 0 USDC")
    if (+userInfo.usdc_balance < usdcInput) return alert("Insufficient Balance");

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const accounts = await provider.listAccounts();

    if (!accounts.length) return;
    const account = accounts[0];
    const kingOfTheFoolsContractInstance = new Contract(KING_OF_THE_FOOLS_ADDRESS, kingOfTheFoolsAbi, signer);
    const currentKing = await kingOfTheFoolsContractInstance.kingOfTheFools();
    if (currentKing === account.toString()) return alert("You are the current king! are you trying to overthrow yourself?");

    const usdcContractInstance = new Contract(USDC_TOKEN_ADDRESS, usdcTokenAbi, signer);

    const contractAllowance = await usdcContractInstance.allowance(account.toString(), KING_OF_THE_FOOLS_ADDRESS);


    try {
      if (+formatUnits(contractAllowance, 6) < usdcInput) {
        const byApproval = window.confirm('Insufficient Allowance, Click OK to increase allowance or Cancel and we will use your signature to get everything done');
        if (byApproval) {
          await usdcContractInstance.approve(KING_OF_THE_FOOLS_ADDRESS, parseUnits(usdcInput, 6));
          const usdcUnits = utils.parseUnits(usdcInput, 6);
          const depositTx = await kingOfTheFoolsContractInstance.depositUSDCWithoutPermit(usdcUnits);

          await provider.getTransaction(depositTx.hash)
          depositTx.wait();
        }
        else {
          const receiveAuthorization = await getDataForReceiveWithPermit(usdcInput);
          await kingOfTheFoolsContractInstance.depositUSDCWithPermit(receiveAuthorization);
        }
      }
    } catch (e) {
      return alert("Insufficient Deposit")
    }


    // Get new balances
    await getAccountDetails(account);

  }

  // A function that handles withdrawing claim
  const onClickWithdrawClaim = async (e) => {

    e.preventDefault()
    if (+ethClaim === 0.0 && +usdcClaim === 0.0) return alert("Nothing to Claim")
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const kingOfTheFoolsContractInstance = new Contract(KING_OF_THE_FOOLS_ADDRESS, kingOfTheFoolsAbi, signer);
    const withdrawTx = await kingOfTheFoolsContractInstance.withdrawClaim();

    await withdrawTx.wait();

    // Get new balances
    await getAccountDetails(signer._address);
  }

  const onClickWithdrawContractClaim = async (e) => {

    e.preventDefault()

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const kingOfTheFoolsContractInstance = new Contract(KING_OF_THE_FOOLS_ADDRESS, kingOfTheFoolsAbi, signer);
    const contractClaim = await kingOfTheFoolsContractInstance.pendingClaims(KING_OF_THE_FOOLS_ADDRESS);
    if (+contractClaim[0] === 0 && +contractClaim[1] === 0) return alert("Contract has nothing to claim ");

    const withdrawTx = await kingOfTheFoolsContractInstance.withdrawContractClaim();

    await withdrawTx.wait();
  }

  const onClickPause = async (e) => {
    e.preventDefault()
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const accounts = await provider.listAccounts();
    if (!accounts.length) return;
    const account = accounts[0];
    if (account.toString() !== contractOwner) return alert("You are not the owner of this contract");
    const kingOfTheFoolsContractInstance = new Contract(KING_OF_THE_FOOLS_ADDRESS, kingOfTheFoolsAbi, signer);
    const pauseTx = await kingOfTheFoolsContractInstance.pause();

    await pauseTx.wait();
  }

  const onClickUnpause = async (e) => {
    e.preventDefault()
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const accounts = await provider.listAccounts();
    if (!accounts.length) return;
    const account = accounts[0];
    if (account.toString() !== contractOwner) return alert("You are not the owner of this contract");
    const kingOfTheFoolsConftractInstance = new Contract(KING_OF_THE_FOOLS_ADDRESS, kingOfTheFoolsAbi, signer);
    const unpauseTx = await kingOfTheFoolsConftractInstance.unpause();

    await unpauseTx.wait();
  }

  const getDataForReceiveWithPermit = async (deposit) => {
    const [nonce, name, version, chainId] = await Promise.all([
      hexlify(randomBytes(32)),
      "USD Coin",
      "2",
      CHAIN_ID, // ChainId for Goerli testnet
    ]);

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const accounts = await provider.listAccounts();
    if (!accounts.length) return;
    const account = accounts[0];

    const validAfter = 0;
    const validBefore = Math.floor(Date.now() / 1000) + 3600; // Valid for an hour
    const { v, r, s } = ethers.utils.splitSignature(
      // eslint-disable-next-line no-underscore-dangle
      await signer._signTypedData(
        {
          name,
          version,
          chainId,
          verifyingContract: USDC_TOKEN_ADDRESS,
        },
        {
          ReceiveWithAuthorization: [
            {
              name: "from",
              type: "address",
            },
            {
              name: "to",
              type: "address",
            },
            {
              name: "value",
              type: "uint256",
            },
            {
              name: "validAfter",
              type: "uint256",
            },
            {
              name: "validBefore",
              type: "uint256",
            },
            {
              name: "nonce",
              type: "bytes32",
            },
          ],
        },
        {
          from: account.toString(),
          to: KING_OF_THE_FOOLS_ADDRESS,
          value: deposit,
          validAfter,
          validBefore,
          nonce,
        }
      )
    );


    return defaultAbiCoder.encode(
      [
        "address",
        "address",
        "uint",
        "uint",
        "uint",
        "bytes32",
        "uint8",
        "bytes32",
        "bytes32",
      ],
      [account.toString(), KING_OF_THE_FOOLS_ADDRESS, parseUnits(deposit, 6), validAfter, validBefore, nonce, v, r, s]
    );
  }

  return (
    <div className="App">
      <Header
        connectWallet={connectWallet}
        connected={connected}
        userInfo={userInfo}
      />
      <main className='main'>
        <MyClaim
          usdcInput={usdcInput}
          ethInput={ethInput}
          onChangeInput={onChangeInput}
          onClickDepositETH={onClickDepositETH}
          onClickDepositUSDC={onClickDepositUSDC}
          onClickWithdrawClaim={onClickWithdrawClaim}
          onClickWithdrawContractClaim={onClickWithdrawContractClaim}
          onClickPause={onClickPause}
          onClickUnpause={onClickUnpause}
          isOwner={contractOwner === userInfo.address}
          ethClaim={ethClaim}
          usdcClaim={usdcClaim}
          connected={connected}
          noClaim={noClaim}
          usdPerETH={usdPerETH}
          rateUpdatedAt={rateUpdatedAt}
          nextETHDeposit={nextETHDeposit}
          nextUSDCDeposit={nextUSDCDeposit}
        />
        <KingOfTheFoolsHistory
          kingOfTheFools={kingOfTheFoolsHistory}
        />
      </main>
      <Footer />
    </div>
  );
}

export default App;

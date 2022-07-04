const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const Fortmatic = window.Fortmatic;
const evmChains = window.evmChains;
const CONTRACT_ADDRESS = "0xD4520CDb725fbCb5e458E672d33dca821618FE0E";

let web3Modal;

// Chosen wallet provider given by the dialog window
let provider;

// Address of the selected account
let selectedAccount;

// web3 Instance
let web3Instance;

//Setting inital setups
function init() {
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        // Mikko's test key - don't copy as your mileage may vary
        infuraId: "8043bb2cf99347b1bfadfb233c5325c0",
      },
    },
    fortmatic: {
      package: Fortmatic,
      options: {
        // Mikko's TESTNET api key
        key: "pk_test_391E26A3B43A3350",
      },
    },
  };
  web3Modal = new Web3Modal({
    cacheProvider: false, // optional
    providerOptions, // required
    disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
    theme: "dark",
  });
}

//Connect walle when button pressed
async function onConnect() {
  try {
    provider = await web3Modal.connect();
  } catch (e) {
    console.log("Could not get a wallet connection", e);
    return;
  }

  provider.on("accountsChanged", (accounts) => {
    console.log("accountsChanged", accounts);

    fetchAccountData();
  });

  // Subscribe to chainId change
  provider.on("chainChanged", (chainId) => {
    console.log("chainChanged", chainId);
    fetchAccountData();
  });

  // Subscribe to networkId change
  provider.on("networkChanged", (networkId) => {
    console.log("networkId :>> ", networkId);
    fetchAccountData();
  });

  await fetchAccountData();
}
async function onDisconnect() {
  console.log("Killing the wallet connection", provider);

  // TODO: Which providers have close method?
  if (provider.close) {
    await provider.disconnect();

    // If the cached provider is not cleared,
    // WalletConnect will default to the existing session
    // and does not allow to re-scan the QR code with a new wallet.
    // Depending on your use case you may want or want not his behavir.
    await web3Modal.clearCachedProvider();
    provider = null;
  }

  selectedAccount = null;
}

// After a provider was selected
async function fetchAccountData() {
  // Get a Web3 instance for the wallet
  web3Instance = new Web3(provider);

  // Get connected chain id from Ethereum node
  const chainId = await web3Instance.eth.getChainId();
  // Load chain information over an HTTP API
  const chainData = evmChains.getChain(chainId);
  console.log("chaindata is", chainData);

  document.querySelector("#net").innerHTML = chainData.name;

  // Get list of accounts of the connected wallet
  const accounts = await web3Instance.eth.getAccounts();

  // MetaMask does not give you all accounts, only the selected account
  selectedAccount = accounts[0];
  document.querySelector("#account").innerHTML = selectedAccount;

  // Go through all accounts and get their ETH balance
}

function grabJson() {
  return fetch("./abi.json").then((response) => response.json());
}
// Contract info
async function fetchContractData() {
  const contractAbi = await grabJson();

  const nameContract = new web3Instance.eth.Contract(
    contractAbi,
    CONTRACT_ADDRESS
  );

  console.log(nameContract);

  nameContract.methods.mintNFT([1]).send();
}

// Entry point
window.addEventListener("load", async () => {
  init();
  document.querySelector("#btn-connect").addEventListener("click", onConnect);
  document
    .querySelector("#btn-disconnect")
    .addEventListener("click", onDisconnect);
  document
    .querySelector("#btn-contract")
    .addEventListener("click", fetchContractData);
});

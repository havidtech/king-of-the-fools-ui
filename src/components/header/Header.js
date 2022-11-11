import React from 'react'
import Connected from '../Connected/Connected'
import Styles from "./Header.module.css"
const Header = ({userInfo, connected, connectWallet}) => {
  return (
    <div className={Styles.root}>
        <span className={Styles.logo}>KING-of<span className={Styles.logo2}>-the-FOOLS</span></span>
        <div className="">
            {connected ? <Connected
              eth_balance = {userInfo.eth_balance}
              usdc_balance = {userInfo.usdc_balance}
              address = {userInfo.address}
            /> : <button onClick={connectWallet} className={Styles.connect_btn}>Connect Wallet</button>}
        </div>
    </div>
  )
}

export default Header
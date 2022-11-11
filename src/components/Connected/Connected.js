import React from 'react'
import classes from './Connected.module.css';
import { utils } from 'ethers';
import { addressShortner } from '../../utils/helpers';
const Connected = ({eth_balance, usdc_balance, address}) => {
  return (
    <div className= {classes.root}>
        <div className= {classes.token_bal}>{Number(utils.formatUnits(eth_balance, 18)).toFixed(4)} ETH</div>
        <div className= {classes.matic_bal}>{Number(utils.formatUnits(usdc_balance, 6)).toFixed(4)} USDC</div>
        <div className= {classes.address}>{addressShortner(address, true)}</div>
    </div>
  )
}

export default Connected
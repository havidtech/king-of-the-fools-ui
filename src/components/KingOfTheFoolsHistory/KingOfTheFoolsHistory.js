import React from 'react'
import { addressShortner, formatDate } from '../../utils/helpers';
import Styles from './KingOfTheFoolsHistory.module.css';
import clsx from 'clsx';
import { utils } from 'ethers';
import {CURRENCY_ETH, CURRENCY_USDC} from '../../constants'

const KingOfTheFoolsHistory = ({kingOfTheFools}) => {

  return (
    <div className={Styles.root}>
        <center><h1> WALL OF FAME </h1></center>
        <table className= {Styles.table}>
          <thead className = {Styles.table_header}>
              <tr className={Styles.table__head_row}>
                <th className={Styles.table_head_data}>S/N</th>
                <th className={Styles.table_head_data}>Deposit</th>
                <th className={Styles.table_head_data}>Currency</th>
                <th className={Styles.table_head_data}>King of the Fools</th>
                <th className={Styles.table_head_data}>Time</th>
              </tr>
          </thead>
          <tbody>
            {kingOfTheFools.map((item, index) => {
              return <tr key={index} className={clsx({[Styles.table_row]: true, [Styles.usdc_style]: item.currency === CURRENCY_USDC, [Styles.eth_style]: item.currency === CURRENCY_ETH})}>
                <td className= {Styles.table_data}>
                  {index + 1}
                </td>
                <td className= {Styles.table_data}>
                  {item.currency === CURRENCY_ETH ? Number(utils.formatUnits(item.deposit, 18)) : Number(utils.formatUnits(item.deposit, 6))}
                </td>
                <td className= {Styles.table_data}>
                  {item.currency === CURRENCY_ETH ? 'ETH' : 'USDC'}
                </td>
                <td className= {Styles.table_data}>
                  {addressShortner(item.kingOfTheFools, false)}
                </td>
                <td className= {Styles.table_data}>
                  {formatDate(item.time)}
                </td>
              </tr>
            })}
          </tbody>
        </table>
    </div>
  )
}

export default KingOfTheFoolsHistory
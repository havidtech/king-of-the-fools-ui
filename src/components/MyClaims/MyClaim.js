import clsx from 'clsx'
import React from 'react'
import { formatDate } from '../../utils/helpers'
import Card from './Card/Card'
import Styles from './MyClaim.module.css'

const MyClaim = ({
  ethInput,
  usdcInput,
  onChangeInput,
  onClickDepositETH,
  onClickDepositUSDC,
  onClickWithdrawClaim,
  onClickWithdrawContractClaim,
  onClickPause,
  onClickUnpause,
  usdcClaim,
  ethClaim,
  noClaim,
  usdPerETH,
  nextUSDCDeposit,
  nextETHDeposit,
  isOwner,
  rateUpdatedAt,
  connected
}) => {
  return (
    <div className={Styles.root}>
      <h2 className={Styles.heading}>My Claim</h2>

      <div className={Styles.claim_body}>
        <div className={Styles.card_container}>
          <Card
            cardKey="Total ETH"
            cardValue={ethClaim}
          />
          <Card
            cardKey="Total USDC"
            cardValue={usdcClaim}
          />
          <form onSubmit={onClickWithdrawClaim} className={Styles.form} >
            <button type="submit"
              className={clsx({ [Styles.withdraw_btn]: true, [Styles.btn_diabled]: !connected || noClaim })}
              disabled={!connected || noClaim}
            >Withdraw Claim</button>
          </form>
        </div>
        <form onSubmit={onClickDepositETH} className={Styles.form} >
          <input
            type="string"
            placeholder={`Deposit atleast ${nextETHDeposit}`}
            className={Styles.input}
            value={ethInput}
            onChange={onChangeInput}
            id="ETH"
          />
          <button type='submit' className={clsx({ [Styles.deposit_btn]: true, [Styles.btn_diabled]: !connected })}
            disabled={!connected}
          >Deposit ETH</button>
        </form>
        <form onSubmit={onClickDepositUSDC} className={Styles.form} >
          <input
            type="string"
            placeholder={`Deposit atleast ${nextUSDCDeposit}`}
            className={Styles.input}
            value={usdcInput}
            onChange={onChangeInput}
            id="USDC"
          />
          <button type='submit' className={clsx({ [Styles.deposit_btn]: true, [Styles.btn_diabled]: !connected })}
            disabled={!connected}
          >Deposit USDC</button>
        </form>
        <span>Rate: 1 Eth = {usdPerETH} USD (updated at {formatDate(rateUpdatedAt)})</span>
        {isOwner &&
          <>
            <form onSubmit={onClickWithdrawContractClaim} className={Styles.form} >
              <button type="submit"
                className={clsx({ [Styles.withdraw_btn]: true, [Styles.btn_diabled]: !connected })}
                disabled={!connected}
              >Withdraw Contract Claim</button>
            </form>

            <form onSubmit={onClickPause} className={Styles.form} >
              <button type="submit"
                className={clsx({ [Styles.pause_btn]: true, [Styles.btn_diabled]: !connected })}
              >Pause Contract</button>
            </form>
            <form onSubmit={onClickUnpause} className={Styles.form} >
              <button type="submit"
                className={clsx({ [Styles.unpause_btn]: true, [Styles.btn_diabled]: !connected })}
              >Unpause Contract</button>
            </form>
          </>
        }
      </div>
    </div>
  )
}

export default MyClaim
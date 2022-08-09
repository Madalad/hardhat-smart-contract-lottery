const { assert, expect } = require("chai")
const { getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle", function () {
          let raffle, raffleEntranceFee, deployer

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              raffle = await ethers.getContract("Raffle", deployer) // connect to deployer
              raffleEntranceFee = await raffle.getEntranceFee()
          })

          describe("fulfillRandomWords", function () {
              it("works with live chainlink keepers and chainlink VRF, we get a random winner", async function () {
                  //enter raffle
                  const startingTimestamp = await raffle.getLatestTimestamp()
                  const accounts = await ethers.getSigners()

                  // setup listener before entering raffle
                  // just incase blockchain moves too fast
                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!")
                          try {
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerEndBalance = await accounts[0].getBalance() // deployer
                              const endingTimestamp = await raffle.getLatestTimeStamp()
                              console.log("Asserting...")
                              await expect(raffle.getPlayer(0)).to.be.reverted
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              assert.equal(raffleState, 0)
                              assert.equal(
                                  winnerEndBalance.toString(),
                                  winnerStartBalance.add(raffleEntranceFee).toString()
                              )
                              assert(endingTimestamp > startingTimestamp)
                              console.log("Assertions complete!")
                              console.log("Resolving...")
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      // enter the raffle
                      console.log("Entering raffle...")
                      await raffle.enterRaffle({ value: raffleEntranceFee })
                      console.log("Raffle entered!")
                      const winnerStartBalance = await accounts[0].getBalance()
                      console.log("Awaiting settlement...")
                      // code wont complete until our listener has heard the event
                  })
                  console.log("Done!")
              })
          })
      })

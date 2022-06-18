async function main() {
    const newAstarBase = await ethers.getContractFactory('BoxV2');
    let proxy = await upgrades.upgradeProxy(
      '0xf07D0631adB3F2B4a5C7128F57186178D9e4e964',
      newAstarBase
    );
    console.log('Your contract is upgraded! Proxy remains at:', proxy.address);
  }

  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
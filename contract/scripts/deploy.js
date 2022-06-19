// scripts/deploy.js
async function main() {
    const BulkToken = await ethers.getContractFactory("BulkToken");
    console.log("Deploying BulkToken...");
    const proxy = await upgrades.deployProxy(BulkToken);
    console.log("BulkToken deployed to:", proxy.address);
  }

  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
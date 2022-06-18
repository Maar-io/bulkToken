// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "hardhat/console.sol";


/// @author Maar-io
/// @title Bulk token sender
contract BulkToken is Initializable, OwnableUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter public usageCnt;
    uint256 public max_beneficiaries;
    uint256 public version;
    event ContractVersion(uint256 newValue);
    // add new global under this line


    function initialize() public initializer {
        __Ownable_init();
        usageCnt.reset();
        max_beneficiaries = 10;
    }

    /// @notice Check upgradable contract version.
    /// @notice Change this version value for each new contract upgrade
    function getVersion() public {
        version = 1;
        emit ContractVersion(1);
    }

    function multisendToken(address[] calldata _beneficiary, uint256[] calldata _balances) public payable {
        uint256 total = msg.value;
        uint256 toTransfer = 0;
        require(_beneficiary.length <= max_beneficiaries, "Too many beneficiaries" );
        require(_beneficiary.length == _balances.length, "Different number of arrays");

        // check if input value can cover all Tx
        uint256 i = 0;
        for (i; i < _balances.length; i++) {
            toTransfer += _balances[i];
        }
        require(toTransfer == total, "Bad sum of all values to be transferred");

        i = 0;
        for (i; i < _beneficiary.length; i++) {
            require(total >= _balances[i], "bad entry value");
            payable(_beneficiary[i]).transfer(_balances[i]);
            usageCnt.increment();
        }
    }
}
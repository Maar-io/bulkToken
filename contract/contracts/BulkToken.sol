// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "hardhat/console.sol";

abstract contract ERC721Interface {
    function transferFrom(address _from, address _to, uint256 _tokenId) public virtual;
    function balanceOf(address who)  public virtual returns (uint256);
    function isApprovedForAll(address _owner, address _operator) public view virtual returns(bool);
    function setApprovalForAll(address _operator, bool approved) public virtual;
    function gasOptimizedAirdrop(address _invoker, address[] calldata _addrs, uint256[] calldata _tokenIds) external virtual;
}

/// @author Maar-io
/// @title Bulk token sender
contract BulkToken is Initializable, OwnableUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter public usageCnt;
    uint256 public max_beneficiaries;
    uint256 public version;
    event ContractVersion(uint256 newValue);
    event NftsSent(address indexed sentBy, address indexed nftAddress, uint256 sentNfts);

    // add new global varibles under this line


    function initialize() public initializer {
        __Ownable_init();
        usageCnt.reset();
        max_beneficiaries = 100;
    }

    /// @notice Check upgradable contract version.
    /// @notice Change this version value for each new contract upgrade
    function getVersion() public {
        version = 1;
        emit ContractVersion(1);
    }

    /// @notice Send native tokens to multiple beneficiaries
    function multisendToken(address[] calldata _beneficiary, uint256[] calldata _balances) public payable {
        uint256 total = msg.value;
        uint256 toTransfer = 0;
        require(_beneficiary.length <= max_beneficiaries, "Too many beneficiaries" );
        require(_beneficiary.length == _balances.length, "The number of beneficiaries and the number of tokens are not equal");

        // check if input value can cover all Tx
        for (uint i = 0; i < _balances.length; i++) {
            toTransfer += _balances[i];
        }
        require(toTransfer == total, "Bad sum of all values to be transferred");

        for (uint i = 0; i < _beneficiary.length; i++) {
            require(total >= _balances[i], "bad entry value");
            payable(_beneficiary[i]).transfer(_balances[i]);
            usageCnt.increment();
        }
    }

    /// @notice Send ERC721 tokens to multiple beneficiaries
    /// @param _nftAddress The nft contract address
    /// @param _beneficiary The addresses which will receive nfts
    /// @param _tokenIds The nft's tokenId to be sent
    function bulkNftSend(address _nftAddress, address[] memory _beneficiary, uint256[] memory _tokenIds) public {
        require(_beneficiary.length <= max_beneficiaries, "Too many beneficiaries" );
        require(_beneficiary.length == _tokenIds.length, "The number of beneficiaries and the number of tokens are not equal");
        ERC721Interface erc721 = ERC721Interface(_nftAddress);

        for(uint i = 0; i < _beneficiary.length; i++) {
            erc721.transferFrom(msg.sender, _beneficiary[i], _tokenIds[i]);
            usageCnt.increment();
        }
        emit NftsSent(msg.sender, _nftAddress, _beneficiary.length);
    }

    /// @notice Set max num beneficiaries
    /// @param _max_beneficiaries Max num of beneficiaries
    function setMaxBeneficiaries(uint _max_beneficiaries) public onlyOwner{
        max_beneficiaries = _max_beneficiaries;
    }
}
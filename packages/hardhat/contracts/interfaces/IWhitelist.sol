pragma solidity 0.8.1;


interface IWhiteList {
    function isApproved(address entry) external view returns(bool);
 }
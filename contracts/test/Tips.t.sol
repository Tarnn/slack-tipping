// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Tips.sol";

contract TipsTest is Test {
    Tips public tips;
    address public admin;
    address public alice;
    address public bob;
    address public charlie;
    address public tipper;

    function setUp() public {
        admin = address(this);
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        charlie = makeAddr("charlie");
        tipper = makeAddr("tipper");

        // Deploy contract
        tips = new Tips(admin, "Tips Token", "TIP");

        // Give tipper the TIP_ON_BEHALF_OF_ROLE
        tips.grantRole(tips.TIP_ON_BEHALF_OF_ROLE(), tipper);
    }

    function testInitialState() view public {
        assertEq(tips.name(), "Tips Token");
        assertEq(tips.symbol(), "TIP");
        assertTrue(tips.hasRole(tips.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(tips.hasRole(tips.REGISTER_ROLE(), admin));
        assertTrue(tips.hasRole(tips.TIP_ON_BEHALF_OF_ROLE(), tipper));
    }

    function testRegistration() public {
        // Test registration
        tips.registerAccount(alice);
        assertTrue(tips.isRegistered(alice));

        // Test unregistration
        tips.unregisterAccount(alice);
        assertFalse(tips.isRegistered(alice));
    }

    function testRegistrationOnlyRegisterRole() public {
        // Try to register from non-authorized account
        vm.prank(alice);
        vm.expectRevert();
        tips.registerAccount(bob);
    }

    function testTipping() public {
        // Register sender account
        tips.registerAccount(alice);

        // Test successful tip to unregistered recipient
        vm.prank(alice);
        tips.tip(bob, alice, 1 * 10**18);
        assertEq(tips.balanceOf(bob), 1 * 10**18);
    }

    function testTipUnregisteredSender() public {
        vm.prank(alice);
        vm.expectRevert(SenderNotRegistered.selector);
        tips.tip(bob, alice, 1 * 10**18);
    }

    function testTipToSelf() public {
        tips.registerAccount(alice);
        
        vm.prank(alice);
        vm.expectRevert(CannotTipYourself.selector);
        tips.tip(alice, alice, 1 * 10**18);
    }

    function testDailyTipLimit() public {
        tips.registerAccount(alice);

        // Send max daily limit
        vm.prank(alice);
        tips.tip(bob, alice, 5 * 10**18);

        // Try to send more
        vm.prank(alice);
        vm.expectRevert(DailyTipLimitExceeded.selector);
        tips.tip(bob, alice, 1);
    }

    function testTipLimitReset() public {
        tips.registerAccount(alice);

        // Send max daily limit
        vm.prank(alice);
        tips.tip(bob, alice, 5 * 10**18);

        // Move forward 24 hours
        vm.warp(block.timestamp + 24 hours);

        // Should be able to tip again
        vm.prank(alice);
        tips.tip(bob, alice, 1 * 10**18);
        assertEq(tips.balanceOf(bob), 6 * 10**18);
    }

    function testTipOnBehalfOf() public {
        tips.registerAccount(alice);

        // Tipper (with TIP_ON_BEHALF_OF_ROLE) tips on behalf of alice
        vm.prank(tipper);
        tips.tip(bob, alice, 1 * 10**18);
        assertEq(tips.balanceOf(bob), 1 * 10**18);
    }

    function testUnauthorizedTipOnBehalfOf() public {
        tips.registerAccount(alice);

        // Charlie (without TIP_ON_BEHALF_OF_ROLE) tries to tip on behalf of alice
        vm.prank(charlie);
        vm.expectRevert(SenderNotAuthorized.selector);
        tips.tip(bob, alice, 1 * 10**18);
    }
}

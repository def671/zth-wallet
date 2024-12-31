const {ipcRenderer} = require("electron");

class Wallets {
  constructor() {
    this.addressList = [];
    $.getJSON("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=zether", function (price) {
      ZthWallets._setPrice(price.USD);
    });
  }

  _getPrice() {
    return this.price;
  }

  _setPrice(price) {
    this.price = price;
  }

  getAddressList() {
    return this.addressList;
  }

  clearAddressList() {
    this.addressList = [];
  }

  getAddressExists(address) {
    if (address) {
      return this.addressList.indexOf(address.toLowerCase()) > -1;
    } else {
      return false;
    }
  }

  addAddressToList(address) {
    if (address) {
      this.addressList.push(address.toLowerCase());
    }
  }

  enableButtonTooltips() {
    ZthUtils.createToolTip("#btnNewAddress", "Create New Address");
    ZthUtils.createToolTip("#btnRefreshAddress", "Refresh Address List");
    ZthUtils.createToolTip("#btnExportAccounts", "Export Accounts");
    ZthUtils.createToolTip("#btnImportAccounts", "Import Accounts");
    ZthUtils.createToolTip("#btnImportFromPrivateKey", "Import From Private Key");
  }

  validateNewAccountForm() {
    if (ZthMainGUI.getAppState() == "account") {
      if (!$("#walletPasswordFirst").val()) {
        ZthMainGUI.showGeneralError("Password cannot be empty!");
        return false;
      }

      if (!$("#walletPasswordSecond").val()) {
        ZthMainGUI.showGeneralError("Password cannot be empty!");
        return false;
      }

      if ($("#walletPasswordFirst").val() !== $("#walletPasswordSecond").val()) {
        ZthMainGUI.showGeneralError("Passwords do not match!");
        return false;
      }

      return true;
    } else {
      return false;
    }
  }

  validateImportFromKeyForm() {
    if (ZthMainGUI.getAppState() == "account") {
      if (!$("#inputPrivateKey").val()) {
        ZthMainGUI.showGeneralError("Private key cannot be empty!");
        return false;
      }

      if (!$("#keyPasswordFirst").val()) {
        ZthMainGUI.showGeneralError("Password cannot be empty!");
        return false;
      }

      if (!$("#keyPasswordSecond").val()) {
        ZthMainGUI.showGeneralError("Password cannot be empty!");
        return false;
      }

      if ($("#keyPasswordFirst").val() !== $("#keyPasswordSecond").val()) {
        ZthMainGUI.showGeneralError("Passwords do not match!");
        return false;
      }

      return true;
    } else {
      return false;
    }
  }

  renderWalletsState() {
    // clear the list of addresses
    ZthWallets.clearAddressList();

    ZthBlockchain.getAccountsData(function (error) {
      ZthMainGUI.showGeneralError(error);
    }, function (data) {
      data.addressData.forEach(element => {
        ZthWallets.addAddressToList(element.address);
      });

      // render the wallets current state
      ZthMainGUI.renderTemplate("wallets.html", data);
      $(document).trigger("render_wallets");
      ZthWallets.enableButtonTooltips();

      $("#labelSumDollars").html(vsprintf("/ %.2f $ / %.4f $ per ZTH", [
        data.sumBalance * ZthWallets._getPrice(),
        ZthWallets._getPrice()
      ]));
    });
  }
}

// the event to tell us that the wallets are rendered
$(document).on("render_wallets", function () {
  if ($("#addressTable").length > 0) {
    new Tablesort(document.getElementById("addressTable"));
    $("#addressTable").floatThead();
  }

  $("#btnNewAddress").off("click").on("click", function () {
    $("#dlgCreateWalletPassword").iziModal();
    $("#walletPasswordFirst").val("");
    $("#walletPasswordSecond").val("");
    $("#dlgCreateWalletPassword").iziModal("open");

    function doCreateNewWallet() {
      $("#dlgCreateWalletPassword").iziModal("close");

      if (ZthWallets.validateNewAccountForm()) {
        ZthBlockchain.createNewAccount($("#walletPasswordFirst").val(), function (error) {
          ZthMainGUI.showGeneralError(error);
        }, function (account) {
          ZthWallets.addAddressToList(account);
          ZthWallets.renderWalletsState();

          iziToast.success({title: "Created", message: "New wallet was successfully created", position: "topRight", timeout: 5000});
        });
      }
    }

    $("#btnCreateWalletConfirm").off("click").on("click", function () {
      doCreateNewWallet();
    });

    $("#dlgCreateWalletPassword").off("keypress").on("keypress", function (e) {
      if (e.which == 13) {
        doCreateNewWallet();
      }
    });
  });

  $(".btnShowAddressTransactions").off("click").on("click", function () {
    ZthTransactions.setFilter($(this).attr("data-wallet"));
    ZthMainGUI.changeAppState("transactions");
    ZthTransactions.renderTransactions();
  });

  $(".btnShowQRCode").off("click").on("click", function () {
    var QRCodeAddress = $(this).attr("data-address");
    $("#dlgShowAddressQRCode").iziModal();
    $("#addrQRCode").html("");
    $("#addrQRCode").qrcode(QRCodeAddress);
    $("#dlgShowAddressQRCode").iziModal("open");

    $("#btnScanQRCodeClose").off("click").on("click", function () {
      $("#dlgShowAddressQRCode").iziModal("close");
    });
  });

  $(".btnChangWalletName").off("click").on("click", function () {
    var walletAddress = $(this).attr("data-wallet");
    var walletName = $(this).attr("data-name");

    $("#dlgChangeWalletName").iziModal();
    $("#inputWalletName").val(walletName);
    $("#dlgChangeWalletName").iziModal("open");

    function doChangeWalletName() {
      var wallets = ZthDatatabse.getWallets();

      // set the wallet name from the dialog box
      wallets.names[walletAddress] = $("#inputWalletName").val();
      ZthDatatabse.setWallets(wallets);

      $("#dlgChangeWalletName").iziModal("close");
      ZthWallets.renderWalletsState();
    }

    $("#btnChangeWalletNameConfirm").off("click").on("click", function () {
      doChangeWalletName();
    });

    $("#dlgChangeWalletName").off("keypress").on("keypress", function (e) {
      if (e.which == 13) {
        doChangeWalletName();
      }
    });
  });

  $("#btnRefreshAddress").off("click").on("click", function () {
    ZthWallets.renderWalletsState();
  });

  $("#btnExportAccounts").off("click").on("click", function () {
    ipcRenderer.send("exportAccounts", {});
  });

  $("#btnImportAccounts").off("click").on("click", function () {
    var ImportResult = ipcRenderer.sendSync("importAccounts", {});

    if (ImportResult.success) {
      iziToast.success({title: "Imported", message: ImportResult.text, position: "topRight", timeout: 2000});
    } else if (ImportResult.success == false) {
      ZthMainGUI.showGeneralError(ImportResult.text);
    }
  });

  $("#btnImportFromPrivateKey").off("click").on("click", function () {
    $("#dlgImportFromPrivateKey").iziModal();
    $("#inputPrivateKey").val("");
    $("#dlgImportFromPrivateKey").iziModal("open");

    function doImportFromPrivateKeys() {
      $("#dlgImportFromPrivateKey").iziModal("close");

      if (ZthWallets.validateImportFromKeyForm()) {
        var account = ZthBlockchain.importFromPrivateKey($("#inputPrivateKey").val(), $("#keyPasswordFirst").val(), function (error) {
          ZthMainGUI.showGeneralError(error);
        }, function (account) {
          if (account) {
            ZthWallets.renderWalletsState();
            iziToast.success({title: "Imported", message: "Account was succesfully imported", position: "topRight", timeout: 2000});
          } else {
            ZthMainGUI.showGeneralError("Error importing account from private key!");
          }
        });
      }
    }

    $("#btnImportFromPrivateKeyConfirm").off("click").on("click", function () {
      doImportFromPrivateKeys();
    });

    $("#dlgImportFromPrivateKey").off("keypress").on("keypress", function (e) {
      if (e.which == 13) {
        doImportFromPrivateKeys();
      }
    });
  });

  $(".textAddress").off("click").on("click", function () {
    ZthMainGUI.copyToClipboard($(this).html());

    iziToast.success({title: "Copied", message: "Address was copied to clipboard", position: "topRight", timeout: 2000});
  });
});

// event that tells us that geth is ready and up
$(document).on("onGethReady", function () {
  ZthMainGUI.changeAppState("account");
  ZthWallets.renderWalletsState();
});

$(document).on("onNewAccountTransaction", function () {
  if (ZthMainGUI.getAppState() == "account") {
    ZthWallets.renderWalletsState();
  }
});

ZthWallets = new Wallets();

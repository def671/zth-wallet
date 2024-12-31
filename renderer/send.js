// In renderer process (web page).
const {ipcRenderer} = require("electron");

class SendTransaction {
  constructor() {}

  renderSendState() {
    ZthBlockchain.getAccountsData(function (error) {
      ZthMainGUI.showGeneralError(error);
    }, function (data) {
      ZthMainGUI.renderTemplate("send.html", data);
      $(document).trigger("render_send");
    });
  }

  validateSendForm() {
    if (ZthMainGUI.getAppState() == "send") {
      if (!$("#sendFromAddress").val()) {
        ZthMainGUI.showGeneralError("Sender address must be specified!");
        return false;
      }

      if (!ZthBlockchain.isAddress($("#sendFromAddress").val())) {
        ZthMainGUI.showGeneralError("Sender address must be a valid address!");
        return false;
      }

      if (!$("#sendToAddress").val()) {
        ZthMainGUI.showGeneralError("Recipient address must be specified!");
        return false;
      }

      if (!ZthBlockchain.isAddress($("#sendToAddress").val())) {
        ZthMainGUI.showGeneralError("Recipient address must be a valid address!");
        return false;
      }

      if (Number($("#sendAmmount").val()) <= 0) {
        ZthMainGUI.showGeneralError("Send amount must be greater then zero!");
        return false;
      }

      return true;
    } else {
      return false;
    }
  }

  resetSendForm() {
    if (ZthMainGUI.getAppState() == "send") {
      $("#sendToAddressName").html("");
      $("#sendToAddress").val("");
      $("#sendAmmount").val(0);
    }
  }
}

$(document).on("render_send", function () {
  $("select").formSelect({classes: "fromAddressSelect"});

  $("#sendFromAddress").on("change", function () {
    var optionText = $(this).find("option:selected").text();
    var addrName = optionText.substr(0, optionText.indexOf("-"));
    var addrValue = optionText.substr(optionText.indexOf("-") + 1);
    $(".fromAddressSelect input").val(addrValue.trim());
    $("#sendFromAddressName").html(addrName.trim());

    web3Local.eth.getBalance(this.value, function (error, balance) {
      $("#sendMaxAmmount").html(parseFloat(web3Local.utils.fromWei(balance, "ether")));
    });
  });

  $("#btnSendAll").off("click").on("click", function () {
    $("#sendAmmount").focus();
    $("#sendAmmount").val($("#sendMaxAmmount").html());
  });

  $("#sendToAddress").off("input").on("input", function () {
    var addressName = null;
    $("#sendToAddressName").html("");
    addressName = ZthAddressBook.getAddressName($("#sendToAddress").val());

    if (!addressName) {
      var wallets = ZthDatatabse.getWallets();
      addressName = wallets.names[$("#sendToAddress").val()];
    }
    $("#sendToAddressName").html(addressName);
  });

  $("#btnLookForToAddress").off("click").on("click", function () {
    ZthBlockchain.getAddressListData(function (error) {
      ZthMainGUI.showGeneralError(error);
    }, function (addressList) {
      var addressBook = ZthAddressBook.getAddressList();

      for (var key in addressBook) {
        if (addressBook.hasOwnProperty(key)) {
          var adddressObject = {};
          adddressObject.address = key;
          adddressObject.name = addressBook[key];
          addressList.addressData.push(adddressObject);
        }
      }

      $("#dlgAddressList").iziModal({width: "800px"});
      ZthMainGUI.renderTemplate("addresslist.html", addressList, $("#dlgAddressListBody"));
      $("#dlgAddressList").iziModal("open");

      $(".btnSelectToAddress").off("click").on("click", function () {
        $("#sendToAddressName").html($(this).attr("data-name"));
        $("#sendToAddress").val($(this).attr("data-wallet"));
        $("#dlgAddressList").iziModal("close");
      });

      $("#addressListFilter").off("input").on("input", function (e) {
        ZthUtils.filterTable($("#addressTable"), $("#addressListFilter").val());
      });

      $("#btnClearSearchField").off("click").on("click", function () {
        ZthUtils.filterTable($("#addressTable"), "");
        $("#addressListFilter").val("");
      });
    });
  });

  $("#btnAddToAddressBook").off("click").on("click", function () {
    if (ZthBlockchain.isAddress($("#sendToAddress").val())) {
      $("#dlgAddAddressToBook").iziModal();
      $("#inputAddressName").val("");
      $("#dlgAddAddressToBook").iziModal("open");

      function doAddAddressToAddressBook() {
        ZthAddressBook.setAddressName($("#sendToAddress").val(), $("#inputAddressName").val());
        $("#dlgAddAddressToBook").iziModal("close");

        iziToast.success({title: "Success", message: "Address was added to address book", position: "topRight", timeout: 2000});
      }
    } else {
      ZthMainGUI.showGeneralError("Recipient address is not valid!");
    }

    $("#btnAddAddressToBookConfirm").off("click").on("click", function () {
      doAddAddressToAddressBook();
    });

    $("#dlgAddAddressToBook").off("keypress").on("keypress", function (e) {
      if (e.which == 13) {
        doAddAddressToAddressBook();
      }
    });
  });

  $("#btnSendTransaction").off("click").on("click", function () {
    if (ZthSend.validateSendForm()) {
      ZthBlockchain.getTranasctionFee($("#sendFromAddress").val(), $("#sendToAddress").val(), $("#sendAmmount").val(), function (error) {
        ZthMainGUI.showGeneralError(error);
      }, function (data) {
        $("#dlgSendWalletPassword").iziModal();
        $("#walletPassword").val("");
        $("#fromAddressInfo").html($("#sendFromAddress").val());
        $("#toAddressInfo").html($("#sendToAddress").val());
        $("#valueToSendInfo").html($("#sendAmmount").val());
        $("#feeToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
        $("#dlgSendWalletPassword").iziModal("open");

        function doSendTransaction() {
          $("#dlgSendWalletPassword").iziModal("close");

          ZthBlockchain.prepareTransaction($("#walletPassword").val(), $("#sendFromAddress").val(), $("#sendToAddress").val(), $("#sendAmmount").val(), function (error) {
            ZthMainGUI.showGeneralError(error);
          }, function (data) {
            ZthBlockchain.sendTransaction(data.raw, function (error) {
              ZthMainGUI.showGeneralError(error);
            }, function (data) {
              ZthSend.resetSendForm();

              iziToast.success({title: "Sent", message: "Transaction was successfully sent to the chain", position: "topRight", timeout: 5000});

              ZthBlockchain.getTransaction(data, function (error) {
                ZthMainGUI.showGeneralError(error);
              }, function (transaction) {
                ipcRenderer.send("storeTransaction", {
                  block: transaction.blockNumber,
                  txhash: transaction.hash.toLowerCase(),
                  fromaddr: transaction.from.toLowerCase(),
                  timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
                  toaddr: transaction.to.toLowerCase(),
                  value: transaction.value
                });
              });
            });
          });
        }

        $("#btnSendWalletPasswordConfirm").off("click").on("click", function () {
          doSendTransaction();
        });

        $("#dlgSendWalletPassword").off("keypress").on("keypress", function (e) {
          if (e.which == 13) {
            doSendTransaction();
          }
        });
      });
    }
  });
});

// create new account variable
ZthSend = new SendTransaction();

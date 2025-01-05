// In renderer process (web page).
const { ipcRenderer } = require("electron");

class MainGUI {
  constructor() {
    this.appState = "account";
  }

  changeAppState(newState) {
    this.appState = newState;
    $(".sidebarIconWrapper").removeClass("iconSelected");

    switch (this.appState) {
      case "account":
        $("#mainNavBtnWalletsWrapper").addClass("iconSelected");
        break;
      case "addressBook":
        $("#mainNavBtnAddressBoookWrapper").addClass("iconSelected");
        break;
      case "send":
        $("#mainNavBtnSendWrapper").addClass("iconSelected");
        break;
      case "transactions":
        $("#mainNavBtnTransactionsWrapper").addClass("iconSelected");
        break;
      case "markets":
        $("#mainNavBtnMarketsWrapper").addClass("iconSelected");
        break;
      case "settings":
        $("#mainNavBtnSettingsWrapper").addClass("iconSelected");
        break;
      default: // do nothing for now
    }
  }

  getAppState() {
    return this.appState;
  }

  showGeneralError(errorText) {
    $("#txtGeneralError").html(errorText);

    // create and open the dialog
    $("#dlgGeneralError").iziModal();
    $("#dlgGeneralError").iziModal("open");

    $("#btnGeneralErrorOK").click(function () {
      $("#dlgGeneralError").iziModal("close");
    });
  }

  showGeneralConfirmation(confirmText, callback) {
    $("#txtGeneralConfirm").html(confirmText);

    // create and open the dialog
    $("#dlgGeneralConfirm").iziModal();
    $("#dlgGeneralConfirm").iziModal("open");

    $("#btnGeneralConfirmYes").click(function () {
      $("#dlgGeneralConfirm").iziModal("close");
      callback(true);
    });

    $("#btnGeneralConfirmNo").click(function () {
      $("#dlgGeneralConfirm").iziModal("close");
      callback(false);
    });
  }

  showAboutDialog(infoData) {
    $("#versionNumber").html(infoData.version);

    // create and open the dialog
    $("#dlgAboutInfo").iziModal();
    $("#dlgAboutInfo").iziModal("open");

    $("#urlOpenLicence, #urlOpenGitHub").off("click").on("click", function (even) {
      event.preventDefault();
      ipcRenderer.send("openURL", $(this).attr("href"));
    });

    $("#btnAboutInfoClose").off("click").on("click", function (even) {
      $("#dlgAboutInfo").iziModal("close");
    });
  }

  renderTemplate(template, data, container) {
    var template = Handlebars.compile(ipcRenderer.sendSync("getTemplateContent", template));

    if (!container) {
      container = $("#mainContent");
    }

    container.empty();
    container.html(template(data));
  }

  copyToClipboard(text) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val(text).select();
    document.execCommand("copy");
    $temp.remove();
  }
}

// Listener for showing non-blocking notifications
ipcRenderer.on("showNotification", (event, data) => {
  const notification = document.createElement("div");
  notification.className = `notification ${data.type}`;
  notification.innerText = data.message;

  document.body.appendChild(notification);

  // Automatically dismiss the notification after 5 seconds
  setTimeout(() => {
    notification.remove();
  }, 5000);
});

ipcRenderer.on("showAboutDialog", function (event, message) {
  ZthMainGUI.showAboutDialog(message);
});

$("#mainNavBtnTransactions").click(function () {
  ZthTransactions.clearFilter();
  ZthMainGUI.changeAppState("transactions");
  ZthTransactions.renderTransactions();
});

$("#mainNavBtnAddressBoook").click(function () {
  ZthMainGUI.changeAppState("addressBook");
  ZthAddressBook.renderAddressBook();
});

$("#mainNavBtnSend").click(function () {
  ZthMainGUI.changeAppState("send");
  ZthSend.renderSendState();
});

$("#mainNavBtnWallets").click(function () {
  ZthMainGUI.changeAppState("account");
  ZthWallets.renderWalletsState();
});

$("#mainNavBtnMarkets").click(function () {
  ZthMainGUI.changeAppState("markets");
  ZthMarkets.renderMarkets();
});

$("#mainNavBtnSettings").click(function () {
  ZthMainGUI.changeAppState("settings");
  ZthSettings.renderSettingsState();
});

ZthMainGUI = new MainGUI();

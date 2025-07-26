
document.addEventListener('DOMContentLoaded', () => {


const ESPDeviceOrigin = document.getElementById("espOrigin");
ESPDeviceOrigin.style = "display: none";
const plusButton = document.getElementById("plusB");
const mainButton = document.getElementById("mainButton");
const thirdButton = document.getElementById("thirdButton");



let espDeviceElementList = [];

function refreshDevice2Win(deviceList){
    // const fatherEle = document.getElementById("a77");
    // let aNewEle = ESPDeviceOrigin.cloneNode(true);
    // aNewEle.setAttribute("index", espDeviceList.length);
    // aNewEle.id = "device_" ;
    // aNewEle.className = "device-item device-item-connected flex items-center mb-[12px] pt-[12px] pr-[12px] pb-[12px] pl-[12px] rounded-tl-[6px] rounded-tr-[6px] rounded-br-[6px] rounded-bl-[6px]";
    // espDeviceList[espDeviceList.length] = aNewEle;


    // fatherEle.appendChild(aNewEle);

    let fatherEle = document.getElementById("a77");

    for(let j = fatherEle.children.length - 1; j >= 0; j--){
        fatherEle.children[j].remove();
    }

    for(let i = 0; i < deviceList.length; i++){
        deviceList[i].style = "display: block";
        fatherEle.appendChild(deviceList[i]);
    }


}

window.electronAPI.onDeviceList((devices) => {
    //console.log(devices[0]);
    for(let i = 0; i < devices.length; i++){
        //espDeviceList[i] = devices[i];
        //console.log(devices[i]["name"]);
        let aNewEle = ESPDeviceOrigin.cloneNode(true);
        aNewEle.style = "display: block";
        aNewEle.id = "espDevice_" + i;
        aNewEle.setAttribute("index", i);
        aNewEle.children[1].children[0].innerHTML = devices[i]["name"];
        espDeviceElementList[i] = aNewEle;
    }
    refreshDevice2Win(espDeviceElementList);

    // plusButton.onclick = function(){
    //     window.electronAPI.sendToDevice(devices[0]["id"], "LED_ON\n");
    // }
    // mainButton.onclick = function(){
    //     window.electronAPI.sendToDevice(devices[1]["id"], "LED_ON\n")
    // }
    // thirdButton.onclick = function(){
    //     window.electronAPI.sendToDevice(devices[2]["id"], "LED_ON\n")
    // }
});


});


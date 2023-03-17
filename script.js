
const rowWidth = 230;
const rowheight = 70;
const leftPanelBlockWidth = 44;
const leftPanelBlockheight = 70;
let brigadeDatePosition = new Array();
let timeVerticalPosition = new Array();
let selectedCards = new Array();
let rowWidthLength = 0;
let rowHeightLength = 0;
let waitingBlockWidth = 300;
let waitingPatientsVisible = false;
let timeBlocksAmount = 0;
let eventProperties = {
	event_name: "",
	data: ""
};
let eventPropertiesReturn;
let isTouch = false;

let draggedCards = new Array();

let grid = {};

function doctra_call(functionName, data) {
	switch (functionName) {
		case "update_cells":
			update_cells(data);
			break;
		case "init_commands":
			init_commands(data, false);
			break;
		case "update_queue":
			update_queue(data);
			break;
		case "init_commands_queue":
			init_commands(data, true);
			break;
		default:
			break;
	}
}

function init_commands(jsonString, queue) {
	let json = JSON.parse(jsonString);	

	isTouch = (('ontouchstart' in window) ||
		(navigator.maxTouchPoints > 0) ||
		(navigator.msMaxTouchPoints > 0));

	contextMenuOld = document.getElementById(
		"contextMenu" + (queue ? "Queue" : "")
	);
	if (contextMenuOld) {
		contextMenuOld.outerHTML = "";
	}

	let contextMenuObject = document.createElement("div");
	contextMenuObject.id = "contextMenu" + (queue ? "Queue" : "");
	contextMenuObject.classList.add("contextMenu");
	contextMenuObject.classList.add("displayNone");
	contextMenuObject.setAttribute("contextMenuElement", true);
	document.body.appendChild(contextMenuObject);

	json.commands.forEach((element) => {
		let menuOption = document.createElement("div");
		menuOption.optionType = element.type;
		menuOption.setAttribute("contextMenuElement", true);
		switch (element.type) {
			case "command":
				menuOption.functionName = element.name;
				menuOption.title = element.tooltip;
				menuOption.className = "menuItem";
				menuOption.addEventListener("click", contextMenuElementClick, false);
				menuOption.addEventListener(
					"mouseover",
					contextMenuElementMouseOver,
					false
				);
				menuOption.addEventListener(
					"mouseout",
					contextMenuElementMouseOut,
					false
				);

				let menuimg = document.createElement("img");
				menuimg.src = "assets/" + element.icon.replace("png", "svg");
				menuOption.appendChild(menuimg);

				let menuText = document.createElement("span");
				menuText.innerHTML = element.caption;
				menuOption.appendChild(menuText);
				break;
			case "separator":
				menuOption.className = "separator";
				break;

			default:
				break;
		}
		contextMenuObject.appendChild(menuOption);
	});
}

function update_cells(jsonString) {
	let json = JSON.parse(jsonString);
	if (json.redraw) {
		if (json.text_only) {
			showError(json.text_only);
		} else {
			brigadeDatePosition = new Array();
			timeVerticalPosition = new Array();
			selectedCards = new Array();

			initializeBodyDom();

			generateHeadDom(jsonString);
			generateLeftDom(jsonString);

			bodySpace.style.width = rowWidthLength * rowWidth + "px";
			bodySpace.style.height = rowHeightLength * rowheight + "px";

			prepareGrid(jsonString, json.redraw);
			generateGrid(jsonString, json.redraw);
		}
	} else {
		json.data.forEach((element) => {
			addCard(undefined, element);
		});
	}
}

const showError = (text) => {
	content.innerHTML = "";

	let error = document.createElement("div");
	error.className = "error";
	content.appendChild(error);

	let errorText = document.createElement("h1");
	errorText.innerHTML = text;
	error.appendChild(errorText);
};

function prepareGrid(jsonString, redraw) {
	grid = {};
	let json = JSON.parse(jsonString);

	json.head.forEach((element) => {
		let time = new Date(json.start_time + "Z");
		let end_time = new Date(json.end_time + "Z");
		timeBlocksAmount = 0;
		while (time <= end_time) {
			let dateTime = addMinutes(
				new Date(element.Дата + "Z"),
				time.getUTCHours() * 60 + time.getUTCMinutes()
			);
			let iDFormatDate = getIDFormatDate(dateTime);
			grid[element.БригадаКод + "_" + iDFormatDate] = {
				Время:
					iDFormatDate.substring(6, 8) + ":" + iDFormatDate.substring(8, 10),
				ИД: element.БригадаКод + "_" + iDFormatDate,
				Пустой: true,
			};

			time = addMinutes(time, 30);
			timeBlocksAmount++;
		}
	});

	json.data.forEach((element) => {
		let elementDate = new Date(element["ДатаНачала"] + "Z");

		// let newObject = {};
		// newObject[element.БригадаКод + "_" + getIDFormatDate(elementDate)] = {
		// 	...element,
		// 	Время: element["ВремяНачала"].substring(11, 16),
		// };

		//grid = { ...grid, ...newObject };
		grid[element.БригадаКод + "_" + getIDFormatDate(elementDate)] = {
			...element,
			Время: element["ВремяНачала"].substring(11, 16),
		};
	});
}

function addMinutes(date, minutes) {
	return new Date(date.getTime() + minutes * 60000);
}

function getIDFormatDate(date) {
	return (
		String(date.getUTCFullYear()).substring(2, 4) +
		(date.getUTCMonth() + 1 < 10 ? "0" : "") +
		(date.getUTCMonth() + 1) +
		(date.getUTCDate() < 10 ? "0" : "") +
		date.getUTCDate() +
		(date.getUTCHours() < 10 ? "0" : "") +
		date.getUTCHours() +
		(date.getUTCMinutes() < 10 ? "0" : "") +
		date.getUTCMinutes()
	);
}

function generateGrid(jsonString, redraw) {
	let timeBlockNomer = 1;
	let divcolumn;

	Object.entries(grid).forEach((entry) => {
		const [key, element] = entry;

		if (timeBlockNomer === 1) {
			divcolumn = document.createElement("div");
			divcolumn.classList.add("brigadeColumn");
			bodySpace.appendChild(divcolumn);
		}

		if (timeBlockNomer === 1) {
			previousCard = undefined;
		}
		addCard(divcolumn, element, false);

		if (timeBlockNomer === timeBlocksAmount) {
			timeBlockNomer = 1;
		} else {
			timeBlockNomer++;
		}
	});
}

function update_queue(jsonString) {
	let json = JSON.parse(jsonString);

	// if(json.redraw)
	// {

	// }
	initializeQueueDom();
	generateCardsLeft(jsonString, json.redraw);

	waitingPatientsAmount.innerHTML = waitingContainer.childNodes.length;

	if (waitingContainer.childNodes.length == 0) {
		waitingPatientsImg.style.display = "none";
		waitingPatientsAmount.style.display = "none";
	} else {
		waitingTriger.style.cursor = "pointer";
		waitingPatientsImg.style.display = "block";
		waitingPatientsAmount.style.display = "block";
	}
}

function initializeQueueDom() {
	// let removableDoms = new Array();
	// waitingContainer.childNodes.forEach((element) => {
	// 	removableDoms.push(element);
	// });

	// removableDoms.forEach((element) => {
	// 	element.remove();
	// });

	waitingContainer.innerHTML = "";
}

function initializeBodyDom() {
	content.innerHTML = "";

	let divtable = document.createElement("div");
	divtable.classList.add("divtable");
	divtable.id = "divtable";
	content.appendChild(divtable);

	let divrow1 = document.createElement("div");
	divrow1.classList.add("divrow");
	divrow1.classList.add("toprow");
	divtable.appendChild(divrow1);

	let divrow1left = document.createElement("div");
	divrow1left.classList.add("divcell");
	divrow1left.classList.add("leftcol");
	divrow1left.classList.add("leftcolwidehidden");
	divrow1left.classList.add("toprowleftcol");
	divrow1left.id = "divrow1left";
	divrow1.appendChild(divrow1left);

	let divrow1leftwaiting = document.createElement("div");
	divrow1leftwaiting.classList.add("waiting");
	divrow1leftwaiting.classList.add("displaynone");
	divrow1leftwaiting.id = "divrow1leftwaiting";
	divrow1left.appendChild(divrow1leftwaiting);

	let waitingContainer = document.createElement("div");
	waitingContainer.classList.add("waitingContainer");
	waitingContainer.id = "waitingContainer";
	divrow1leftwaiting.appendChild(waitingContainer);

	let divrow1leftmainleft = document.createElement("div");
	divrow1leftmainleft.classList.add("mainleft");
	divrow1leftmainleft.classList.add("waitingTriger");
	divrow1leftmainleft.id = "waitingTriger";
	divrow1leftmainleft.addEventListener("click", waitingTrigerOnClick, false);
	divrow1left.appendChild(divrow1leftmainleft);

	let waitingPatientsImg = document.createElement("img");
	waitingPatientsImg.id = "waitingPatientsImg";
	waitingPatientsImg.src = "assets/waitingPatients.svg";
	waitingPatientsImg.style.display = "none";
	waitingTriger.appendChild(waitingPatientsImg);

	let waitingPatientsAmount = document.createElement("div");
	waitingPatientsAmount.id = "waitingPatientsAmount";
	waitingPatientsAmount.classList.add("waitingAmount");
	waitingPatientsAmount.style.display = "none";
	waitingTriger.appendChild(waitingPatientsAmount);

	let divrow1Right = document.createElement("div");
	divrow1Right.classList.add("divcell");
	divrow1Right.classList.add("header");
	divrow1.appendChild(divrow1Right);

	let headRowTable = document.createElement("div");
	headRowTable.id = "headRowTable";
	divrow1Right.appendChild(headRowTable);

	let headRowDateRow = document.createElement("div");
	headRowDateRow.id = "headRowDateRow";
	headRowDateRow.className = "divRow";
	headRowTable.appendChild(headRowDateRow);

	let headRowBrigadeRow = document.createElement("div");
	headRowBrigadeRow.id = "headRowBrigadeRow";
	headRowBrigadeRow.className = "divRow";
	headRowTable.appendChild(headRowBrigadeRow);

	headRowTable;

	let divrow2 = document.createElement("div");
	divrow2.classList.add("divrow");
	divtable.appendChild(divrow2);

	let divrow2left = document.createElement("div");
	divrow2left.classList.add("divcell");
	divrow2left.classList.add("leftcol");
	divrow2left.classList.add("leftcolwidehidden");
	divrow2left.classList.add("times");
	divrow2left.id = "divrow2left";
	divrow2.appendChild(divrow2left);

	let divrow2leftwaiting = document.createElement("div");
	divrow2leftwaiting.classList.add("waiting");
	divrow2leftwaiting.classList.add("displaynone");
	divrow2leftwaiting.id = "divrow2leftwaiting";
	divrow2left.appendChild(divrow2leftwaiting);

	let divrow2leftmainleft = document.createElement("div");
	divrow2leftmainleft.classList.add("mainleft");
	divrow2leftmainleft.id = "leftRowTimes";
	divrow2left.appendChild(divrow2leftmainleft);

	let divrow2Right = document.createElement("div");
	divrow2Right.classList.add("divcell");
	divrow2Right.classList.add("container");
	divrow2Right.id = "bodySpace";
	divrow2.appendChild(divrow2Right);

	if (!document.getElementById("contextMenu")) {
		let contextMenu = document.createElement("div");
		contextMenu.id = "contextMenu";
		contextMenu.classList.add("contextMenu");
		contextMenu.classList.add("displayNone");
		document.body.appendChild(contextMenu);
	}

	if (!document.getElementById("contextMenuQueue")) {
		let contextMenuQueue = document.createElement("div");
		contextMenuQueue.id = "contextMenuQueue";
		contextMenuQueue.classList.add("contextMenu");
		contextMenuQueue.classList.add("displayNone");
		document.body.appendChild(contextMenuQueue);
	}
}

function generateHeadDom(jsonString) {
	let headDates = new Array();
	let json = JSON.parse(jsonString);
	json.head.forEach((element) => {
		if (!(element["Дата"] in headDates)) {
			headDates[element["Дата"]] = new Array();
		}
		headDates[element["Дата"]].push(element);
	});

	rowWidthLength = 0;
	Object.keys(headDates).forEach(function (key) {
		headDates[key].forEach((element) => {
			let iDFormatDate = getIDFormatDate(new Date(element.Дата + "Z"));
			let headRowBrigadeid = element.БригадаКод + "_" + iDFormatDate;

			let headRowBrigade = document.createElement("div");
			headRowBrigade.className = "headRowColumn headBrigadeColumn";
			headRowBrigade.style.width = rowWidth - 1 + "px";
			headRowBrigade.id = headRowBrigadeid;
			headRowBrigade.ids = headRowBrigadeid;
			headRowBrigade.addEventListener("dblclick", brigadesOnDoubleClick);
			headRowBrigadeRow.appendChild(headRowBrigade);

			let headRowBrigadeName = document.createElement("div");
			headRowBrigadeName.className = "headRowColumn";
			headRowBrigade.appendChild(headRowBrigadeName);

			let headRowBrigadeNameDiv = document.createElement("div");
			headRowBrigadeNameDiv.className = "divRow";
			headRowBrigadeName.appendChild(headRowBrigadeNameDiv);

			let headRowBrigadeNameSpan = document.createElement("span");
			headRowBrigadeNameSpan.innerHTML = element["Бригада"];
			headRowBrigadeNameDiv.appendChild(headRowBrigadeNameSpan);

			let headRowBrigadeDriver = document.createElement("div");
			headRowBrigadeDriver.className =
				"headRowColumn headRowColumnDriverDoctor";
			headRowBrigade.appendChild(headRowBrigadeDriver);

			let headRowBrigadeDriverDiv = document.createElement("div");
			headRowBrigadeDriverDiv.className = "divRow headRowColumnDriverDoctor";
			headRowBrigadeDriverDiv.innerHTML =
				element["Водитель"] + "<br>" + element["Флеботомист"];
			headRowBrigadeDriver.appendChild(headRowBrigadeDriverDiv);

			// let headRowBrigadeDoctorSpan = document.createElement("div");
			// headRowBrigadeDoctorSpan.innerHTML = element["Флеботомист"];
			// headRowBrigadeDriverDiv.appendChild(headRowBrigadeDoctorSpan);

			// let headRowBrigadeDoctor = document.createElement("div");
			// headRowBrigadeDoctor.className = "headRowColumn";
			// // headRowBrigadeDoctor.innerHTML = element["Флеботомист"];
			// headRowBrigade.appendChild(headRowBrigadeDoctor);

			// let headRowBrigadeDoctorDiv = document.createElement("div");
			// headRowBrigadeDoctorDiv.className = "divRow";
			// headRowBrigadeDoctor.appendChild(headRowBrigadeDoctorDiv);

			// let headRowBrigadeDoctorSpan = document.createElement("span");
			// headRowBrigadeDoctorSpan.innerHTML = element["Флеботомист"];
			// headRowBrigadeDoctorDiv.appendChild(headRowBrigadeDoctorSpan);

			let headRowBrigadeComment = document.createElement("div");
			headRowBrigadeComment.className = "headRowColumn";
			// headRowBrigadeComment.innerHTML = element["Комментарий"];
			headRowBrigade.appendChild(headRowBrigadeComment);

			let headRowBrigadeCommentDiv = document.createElement("div");
			headRowBrigadeCommentDiv.className = "divRow";
			headRowBrigadeComment.appendChild(headRowBrigadeCommentDiv);

			let headRowBrigadeCommentSpan = document.createElement("span");
			headRowBrigadeCommentSpan.innerHTML = element["Комментарий"];
			headRowBrigadeCommentDiv.appendChild(headRowBrigadeCommentSpan);

			brigadeDatePosition[
				element["БригадаКод"] +
				"_" +
				key.split("T")[0].substring(2).split("-").join("")
			] = rowWidthLength;
			rowWidthLength++;
		});

		brigateAmount = headDates[key].length;

		let headRowDate = document.createElement("div");
		headRowDate.className = "headRowColumn";
		// headRowDate.innerHTML = key + headDates[key][0]['ТекстДня'];
		headRowDate.style.width = brigateAmount * rowWidth - 1 + "px";
		headRowDateRow.appendChild(headRowDate);

		let headRowDateDiv = document.createElement("div");
		headRowDateDiv.className = "headDiv";
		headRowDate.appendChild(headRowDateDiv);

		let headRowDateSpanDay = document.createElement("span");
		headRowDateSpanDay.className = "headRowDateSpanDay";
		headRowDateSpanDay.innerHTML = headDates[key][0]["ТекстДня"];
		headRowDateDiv.appendChild(headRowDateSpanDay);

		let headRowDateSpanDate = document.createElement("span");
		headRowDateSpanDate.innerHTML = getHeadRowDate(key);
		headRowDateDiv.appendChild(headRowDateSpanDate);
	});
}

function getHeadRowDate(text) {
	let newText = " ";
	let textBlocks = text.split("T")[0].split("-");

	newText += textBlocks[2] + " ";
	newText += getMonthShortText(textBlocks[1]) + " ";
	newText += textBlocks[0];

	return newText;
}

function getMonthShortText(text) {
	switch (text) {
		case "01":
			return "იან";
		case "02":
			return "თებ";
		case "03":
			return "მარ";
		case "04":
			return "აპრ";
		case "05":
			return "მაი";
		case "06":
			return "ივნ";
		case "07":
			return "ივლ";
		case "08":
			return "აგვ";
		case "09":
			return "სექ";
		case "10":
			return "ოქტ";
		case "11":
			return "ნოე";
		case "12":
			return "დეკ";
	}
}

function generateLeftDom(jsonString) {
	let json = JSON.parse(jsonString);
	let curentDate = new Number(
		json.start_time.split("T")[1].substring(0, 5).split(":").join("")
	);
	let endDate = new Number(
		json.end_time.split("T")[1].substring(0, 5).split(":").join("")
	);
	rowHeightLength = 0;

	while (curentDate <= endDate) {
		let leftRowTime = document.createElement("div");
		leftRowTime.className = "timeSlot";
		leftRowTime.innerHTML =
			String(curentDate < 1000 ? "0" : "") +
			Math.floor(curentDate / 100) +
			":" +
			String(curentDate % 100 == 0 ? "00" : curentDate % 100);
		leftRowTimes.appendChild(leftRowTime);

		timeVerticalPosition[
			String(curentDate < 1000 ? "0" : "") +
			Math.floor(curentDate / 100) +
			String(curentDate % 100 == 0 ? "00" : curentDate % 100)
		] = rowHeightLength;
		rowHeightLength++;

		if (curentDate % 100 == 0) {
			curentDate = curentDate + 30;
		} else {
			curentDate = curentDate + 70;
		}
	}
}

function waitingTrigerOnClick() {
	if (waitingContainer.childNodes.length == 0) {
		return;
	}

	waitingPatientsVisible = !waitingPatientsVisible;
	if (waitingPatientsVisible) {
		// waitingContainer.style.display = "table-cell";

		divrow1left.classList.remove("leftcolwidehidden");
		divrow2left.classList.remove("leftcolwidehidden");

		divrow1left.classList.add("leftcolwide");
		divrow2left.classList.add("leftcolwide");

		divrow1leftwaiting.classList.remove("displaynone");
		divrow2leftwaiting.classList.remove("displaynone");
		//divrow2left.style.left = "calc(var(--leftPanelBlockWidth) + var(--waitingPanelBlockWidth))";
		// bodySpace.style.left = "calc(var(--leftPanelBlockWidth) + var(--waitingPanelBlockWidth))";
	} else {
		// waitingContainer.style.display = "none";

		divrow1left.classList.remove("leftcolwide");
		divrow2left.classList.remove("leftcolwide");

		divrow1left.classList.add("leftcolwidehidden");
		divrow2left.classList.add("leftcolwidehidden");
		// bodySpace.style.left = "calc(var(--leftPanelBlockWidth))";

		divrow1leftwaiting.classList.add("displaynone");
		divrow2leftwaiting.classList.add("displaynone");
	}
}

function generateCardsLeft(jsonString, redraw) {
	let json = JSON.parse(jsonString);
	json.data.forEach((element) => {
		/*
		if (!redraw){
			bodySpace.removeChild(document.getElementById(element["ИД"]));
		}
		*/

		addCard(waitingContainer, element, true);

		if (element["ИД_Сетки"]) {
			timeElement = document.getElementById("time_" + element["ИД"]);
			timeElement.innerHTML =
				"<div class='timeWaiting'><img src='assets/waiting_slot.svg' width='12px'>&nbsp;" +
				timeElement.time +
				"</div>";

			timeElement = document.getElementById("time_" + element["ИД_Сетки"]);
			timeElement.innerHTML =
				"<div class='timeWaiting'><img src='assets/waiting_slot.svg' width='12px'>&nbsp;" +
				timeElement.time +
				"</div>";
		}
	});
}

function addCard(parent, element, leftPanel) {
	let existingObject = document.getElementById("slot_" + element["ИД"]);

	if (
		previousCard &&
		previousCard.booking_document &&
		previousCard.booking_document === element["ДокументБронирования"] &&
		previousCard.booking_document_status === element["Статус"] &&
		//previousCard.booking_document_status === "დაჯავშნილია" &&
		(existingObject && !parent ? existingObject.previousSibling === previousCard : true)
	) {

		if (existingObject && existingObject !== previousCard) {
			ids = getCardIdFromChildNode(existingObject);
			ids.forEach((e) => {
				if (element["ИД"] !== e) {
					let tempslotDiv = document.createElement("div");
					tempslotDiv.id = "slot_" + e;
					tempslotDiv.ids = e;
					existingObject.parentElement.insertBefore(
						tempslotDiv,
						existingObject
					);
				}
			});
			existingObject.parentElement.removeChild(existingObject);
		}

		multiplier = 2;
		if (previousCard.style.height) {
			multiplier = +previousCard.style.height.split("*")[1].split(")")[0] + 1;
		}
		previousCard.style.height = `calc(var(--slotHeight)*${multiplier})`;
		previousCard.childNodes[0].style.height = `calc(var(--slotHeight)*${multiplier} - var(--slotHeight) + var(--slotCardHeight))`;
		previousCard.childNodes[0].childNodes[1].style.height = `calc(var(--slotHeight)*${multiplier} - var(--slotHeight) + var(--slotCardHeight) - var(--slotCardHeight)*2/3)`;

		previousCard.ids += "," + element["ИД"];



		return;
	}

	let slotDiv = document.createElement("div");
	slotDiv.classList.add(leftPanel ? "slotWaiting" : "slot");
	slotDiv.id = "slot_" + element["ИД"];
	slotDiv.ids = element["ИД"];
	slotDiv.booking_document = element["ДокументБронирования"];
	slotDiv.booking_document_status = element["Статус"];
	slotDiv.draggable = !isTouch;
	slotDiv.addEventListener("dragstart", cardOnDragStart);
	slotDiv.addEventListener("dragend", cardOnDragEnd);
	slotDiv.addEventListener("dragover", cardOnDragOver);
	// slotDiv.addEventListener("dragenter", cardOnDragEnter);
	// slotDiv.addEventListener("dragleave", cardOnDragLeave);
	slotDiv.addEventListener("drop", cardOnDrop);
	
	if (existingObject) {
		ids = getCardIdFromChildNode(existingObject);
		existingObject.parentElement.insertBefore(slotDiv, existingObject);
		ids.forEach((e) => {
			if (element["ИД"] !== e) {
				let tempslotDiv = document.createElement("div");
				tempslotDiv.id = "slot_" + e;
				tempslotDiv.ids = e;
				existingObject.parentElement.insertBefore(tempslotDiv, existingObject);
			}
		});
		existingObject.parentElement.removeChild(existingObject);
	} else {
		parent.appendChild(slotDiv);
	}

	let card = document.createElement("div");
	card.className = "card";
	//card.id = element["ИД"];
	card.style.backgroundColor = element["СтатусЦвет"];
	slotDiv.appendChild(card);

	let selectorDiv = document.createElement("div");
	selectorDiv.className = "card-selector";
	selectorDiv.id = element["ИД"];
	selectorDiv.slot_id = element["ИД_Сетки"];
	selectorDiv.comment = element["Комментарий"];
	selectorDiv.addEventListener("click", cardOnClick);
	selectorDiv.addEventListener("dblclick", cardOnDoubleClick);
	selectorDiv.addEventListener("mouseover", cardCommentShow);
	selectorDiv.addEventListener("mouseout", cardCommentHide);

	// let selectorDivComment = document.createElement("div");
	// selectorDivComment.className = "card-selector-comment";
	// selectorDivComment.title = element["Комментарий"];
	// selectorDiv.appendChild(selectorDivComment);

	let selectorDivDriver = document.createElement("div");
	selectorDivDriver.className = "card-selector-driver";
	selectorDivDriver.name = element["Водитель"];
	selectorDivDriver.position = "მძღოლი";
	selectorDivDriver.addEventListener("mouseover", tooltipShow);
	selectorDivDriver.addEventListener("mouseout", tooltipHide);
	selectorDiv.appendChild(selectorDivDriver);

	let selectorDivDoctor = document.createElement("div");
	selectorDivDoctor.className = "card-selector-doctor";
	selectorDivDoctor.name = element["Флеботомист1"];
	selectorDivDoctor.position = "ფლებოტომისტი";
	selectorDivDoctor.addEventListener("mouseover", tooltipShow);
	selectorDivDoctor.addEventListener("mouseout", tooltipHide);
	selectorDiv.appendChild(selectorDivDoctor);

	let selectorDivDoctor2 = document.createElement("div");
	selectorDivDoctor2.className = "card-selector-doctor2";
	selectorDivDoctor2.name = element["Флеботомист2"];
	selectorDivDoctor2.position = "დამხმ. ფლებოტომისტი";
	selectorDivDoctor2.addEventListener("mouseover", tooltipShow);
	selectorDivDoctor2.addEventListener("mouseout", tooltipHide);
	selectorDiv.appendChild(selectorDivDoctor2);

	slotDiv.appendChild(selectorDiv);

	// let dropDiv = document.createElement("div");
	// dropDiv.className = "card-selector";
	// dropDiv.addEventListener("drop", cardOnDrop);
	// dropDiv.addEventListener("dragenter", cardOnDragEnter);
	// dropDiv.addEventListener("dragleave", cardOnDragLeave);
	// dropDiv.addEventListener("drop", cardOnDrop);

	// slotDiv.appendChild(dropDiv);

	previousCard = slotDiv;

	if (element["Пустой"]) {
		slotDiv.classList.add('card-disabled');
		card.classList.add('card-disabled');
		return;
	}

	let cardRow1 = document.createElement("div");
	cardRow1.className = "card-row";
	card.appendChild(cardRow1);

	let fullTime = element["ВремяНачала"].split("T")[1];
	let timeblocks = fullTime.split(":");
	let time = timeblocks[0] + ":" + timeblocks[1];

	let cardColLeft1 = document.createElement("div");
	cardColLeft1.className = "card-col-left";
	cardColLeft1.id = "time_" + element["ИД"];
	cardColLeft1.time = time;
	if (!leftPanel) {
		cardColLeft1.innerHTML = time;
	}
	cardRow1.appendChild(cardColLeft1);

	let cardColRight = document.createElement("div");
	cardColRight.className = "card-col-right";
	cardRow1.appendChild(cardColRight);

	let cardColRightFlex = document.createElement("div");
	cardColRightFlex.className = "flex";
	cardColRightFlex.innerHTML =
		element["Пациент"] == "" ? "&nbsp;" : element["Пациент"];
	cardColRight.appendChild(cardColRightFlex);

	let cardRow2 = document.createElement("div");
	cardRow2.className = "card-row";
	card.appendChild(cardRow2);

	let cardColLeft2 = document.createElement("div");
	cardColLeft2.className = "card-col-left";
	cardRow2.appendChild(cardColLeft2);

	if (element["Комментарий"]) {
		let cardColLeft2Img = document.createElement("img");
		cardColLeft2Img.src = "assets/comment.svg";
		cardColLeft2.appendChild(cardColLeft2Img);
		cardColLeft2.title = element["Комментарий"];
	}

	let cardColRight2 = document.createElement("div");
	cardColRight2.className = "card-col-right";
	cardRow2.appendChild(cardColRight2);

	let cardColRight2Flex = document.createElement("div");
	cardColRight2Flex.className = "flex";
	cardColRight2.appendChild(cardColRight2Flex);

	if (element["КоличествоПациентов"] > 1) {
		let cardColRight2Img = document.createElement("img");
		cardColRight2Img.src = "assets/person.svg";
		cardColRight2Flex.appendChild(cardColRight2Img);

		let cardColRight2FlexText = document.createElement("span");
		cardColRight2FlexText.innerHTML =
			"&nbsp;x&nbsp;" + element["КоличествоПациентов"];
		cardColRight2Flex.appendChild(cardColRight2FlexText);
	} else {
		cardColRight2Flex.innerHTML = "&nbsp;";
	}

	let cardRow3 = document.createElement("div");
	cardRow3.className = "card-row";
	card.appendChild(cardRow3);

	let cardColLeft3 = document.createElement("div");
	cardColLeft3.className = "card-col-left";
	cardRow3.appendChild(cardColLeft3);

	let cardColLeft3circles = document.createElement("div");
	cardColLeft3circles.className = "circles";
	cardColLeft3.appendChild(cardColLeft3circles);

	let circle1 = document.createElement("div");
	circle1.className = "circle";
	if (element["Водитель"] == "") {
		circle1.style.backgroundColor = "#F5F5F5";
	} else {
		circle1.style.backgroundColor = element["ВодительЦвет"];
		circle1.title = element["Водитель"];
	}
	cardColLeft3circles.appendChild(circle1);

	let circle2 = document.createElement("div");
	circle2.className = "circle";
	if (element["Флеботомист1"] == "") {
		circle2.style.backgroundColor = "#F5F5F5";
	} else {
		circle2.style.backgroundColor = element["Флеботомист1Цвет"];
		circle2.title = element["Флеботомист1"];
	}
	cardColLeft3circles.appendChild(circle2);

	let circle3 = document.createElement("div");
	circle3.className = "circle";
	if (element["Флеботомист2"] == "") {
		circle3.style.backgroundColor = "#F5F5F5";
	} else {
		circle3.style.backgroundColor = element["Флеботомист2Цвет"];
		circle3.title = element["Флеботомист2"];
	}
	cardColLeft3circles.appendChild(circle3);

	let cardColRight3 = document.createElement("div");
	cardColRight3.className = "card-col-right";
	cardRow3.appendChild(cardColRight3);

	let cardColRight3Flex = document.createElement("div");
	cardColRight3Flex.className = "flex";
	cardColRight3.appendChild(cardColRight3Flex);

	if (element["Район"] !== "") {
		let cardColRight3Img = document.createElement("img");
		cardColRight3Img.src = "assets/pin.svg";
		cardColRight3Img.style.marginRight = "5px";
		cardColRight3Flex.appendChild(cardColRight3Img);

		let cardColRight3Span = document.createElement("span");
		cardColRight3Span.innerHTML = element["Район"];
		cardColRight3Flex.appendChild(cardColRight3Span);
	}
}

function readTextFile(file, callback) {
	var rawFile = new XMLHttpRequest();
	rawFile.overrideMimeType("application/json");
	rawFile.open("GET", file, true);
	rawFile.onreadystatechange = function () {
		if (rawFile.readyState === 4 && rawFile.status == "200") {
			callback(rawFile.responseText);
		}
	};
	rawFile.send(null);
}

//if (document.addEventListener) {
content.addEventListener("mousedown",
	function (e) {
		hideContextMenu(contextMenu, e);
		hideContextMenu(contextMenuQueue, e);
	});

content.addEventListener(
	"contextmenu",
	function (e) {

		if(e.target.classList.contains('card-selector')){
			if (!e.target.classList.contains('card-selector-selected')) {
				clearSelectedCards();
				selectCard(e);
			}
		}

		hideContextMenu(contextMenu, e);
		hideContextMenu(contextMenuQueue, e);

		let contextMenuObject = undefined;

		if (divrow1left.classList.contains("leftcolwide") && e.x < 300) {
			contextMenuObject = contextMenuQueue;
		} else {
			contextMenuObject = contextMenu;
		}
		
		if (e.target.getAttribute("contextMenuElement") == null) {
			showContextMenu(contextMenuObject, e);
		}
		e.preventDefault();

		console.log(e.target);
	},
	false
);
//}

function showContextMenu(contextMenuObject, e) {
	contextMenuObject.classList.remove("displayNone");

	coords = setContextMenuPostion(e, contextMenuObject);

	contextMenuObject.style.left = coords.x + "px";
	contextMenuObject.style.top = coords.y + "px";
}

function setContextMenuPostion(event, contextMenu) {
	var mousePosition = {};
	var menuPostion = {};
	var menuDimension = {};

	menuDimension.x = contextMenu.offsetWidth;
	menuDimension.y = contextMenu.offsetHeight;
	mousePosition.x = event.pageX;
	mousePosition.y = event.pageY;

	if (
		mousePosition.x + menuDimension.x >
		document.body.offsetWidth + window.scrollX &&
		mousePosition.x - menuDimension.x >= 0
	) {
		menuPostion.x = mousePosition.x - menuDimension.x;
	} else {
		menuPostion.x = mousePosition.x;
	}

	if (
		mousePosition.y + menuDimension.y >
		document.body.offsetHeight + window.scrollY &&
		mousePosition.y - menuDimension.y >= 0
	) {
		menuPostion.y = mousePosition.y - menuDimension.y;
	} else {
		menuPostion.y = mousePosition.y;
	}

	return menuPostion;
}

function hideContextMenu(contextMenuObject, e) {
	try {
		contextMenuObject.classList.add("displayNone");
	} catch (e) { }
}

function sendCommandEvent(eventName, eventParams = null) {
	eventProperties = {
		event_name: "command",
		data: JSON.stringify({
			command_name: eventName,
			cells: selectedCards,
		}),
	};

	hideContextMenu(contextMenu, undefined);
	hideContextMenu(contextMenuQueue, undefined);
}

function sendCardEventClick(id, doubleclick) {
	eventProperties = {
		event_name: !doubleclick ? "click" : "doubleclick",
		data: JSON.stringify({
			type: "cell",
			cells: [id],
		}),
	};
}

function sendBrigadeEventClick(id, doubleclick) {
	eventProperties = {
		event_name: !doubleclick ? "click" : "doubleclick",
		data: JSON.stringify({
			type: "brigade",
			cells: id,
		}),
	};
}

function selectCard(event, doubleclick) {
	let ids = getCardIdFromChildNode(event.target);
	if (selectedCards.includes(ids[0])) {
		selectedCards = selectedCards.filter((e) => !ids.includes(e));
		document.getElementById(ids[0]).classList.remove("card-selector-selected");
	} else {
		ids.forEach((e) => {
			selectedCards.push(e);
		});
		document.getElementById(ids[0]).classList.add("card-selector-selected");
	}
	sendCardEventClick(ids[0], doubleclick);
}

function getCardIdFromChildNode(domElement) {
	if (domElement.ids) {
		return domElement.ids.split(",");
	} else {
		return getCardIdFromChildNode(domElement.parentNode);
	}
}

function clearSelectedCards() {
	selectedCards.forEach((element) => {
		if (document.getElementById(element)) {
			document
				.getElementById(element)
				.classList.remove("card-selector-selected");
		}
	});

	selectedCards = new Array();
}

function contextMenuElementClick(element) {
	if (element.target.parentNode.functionName) {
		sendCommandEvent(element.target.parentNode.functionName);
	} else {
		sendCommandEvent(element.target.functionName);
	}
}

function contextMenuElementMouseOver(element) {
	if (element.target.parentNode.functionName) {
		element.target.parentNode.classList.add("menuItemHover");
	} else {
		element.target.classList.add("menuItemHover");
	}
}

function contextMenuElementMouseOut(element) {
	if (element.target.parentNode.functionName) {
		element.target.parentNode.classList.remove("menuItemHover");
	} else {
		element.target.classList.remove("menuItemHover");
	}
}

function cardOnClick(e) {
	if (e.which != 1) {
		return;
	}
	if (!e.ctrlKey) {
		clearSelectedCards();
	}
	selectCard(e);

	if (e.target.slot_id) {
		let targetSlotId = document.getElementById(e.target.slot_id).parentNode;
		let PositionX =
			targetSlotId.offsetLeft -
			document.body.clientWidth / 2 +
			targetSlotId.clientWidth;
		let PositionY =
			targetSlotId.offsetTop -
			document.body.clientHeight / 2 +
			targetSlotId.clientHeight;
		window.scroll(PositionX, PositionY);
		selectCard({ target: document.getElementById(e.target.slot_id) });
	}
}

function cardOnDoubleClick(e) {
	if (e.which != 1) {
		return;
	}
	clearSelectedCards();

	selectCard(e, true);
}

function brigadesOnDoubleClick(e) {
	if (e.which != 1) {
		return;
	}

	let id = getCardIdFromChildNode(e.target);
	sendBrigadeEventClick(id, true);
}

function tooltipShow(event) {
	let tooltipSource = event.target;
	if (!tooltipSource.name) {
		return;
	}

	let tooltip = document.createElement("div");
	tooltip.classList.add("tooltip");
	tooltipSource.parentNode.appendChild(tooltip);

	let tooltipArrow = document.createElement("img");
	tooltipArrow.classList.add("tooltip-arrow");
	tooltipArrow.src = "assets/tooltip_arrow.svg";
	tooltip.appendChild(tooltipArrow);

	let tooltipBody = document.createElement("div");
	tooltipBody.classList.add("tooltip-body");
	tooltip.appendChild(tooltipBody);

	tooltip.childNodes[1].innerHTML =
		tooltipSource.name + " - " + tooltipSource.position;
	tooltip.style.top = tooltipSource.offsetTop + 20 + "px";
	tooltip.style.left = tooltipSource.offsetLeft - 8 + "px";

	cardCommentHide({ event: { target: event.parent } });
}

function tooltipHide(event) {
	if (!event.target) {
		return;
	}

	event.target.parentElement.childNodes.forEach((element) => {
		if (element.classList.contains("tooltip")) {
			event.target.parentNode.removeChild(element);
		}
	});
}

function cardCommentShow(event) {
	if (!(event.target && event.target.comment)) {
		return;
	}

	let commentDiv = document.createElement("div");
	commentDiv.classList.add("card-selector-comment");
	commentDiv.innerHTML = `<img src="assets/comment_arrow.svg" width="10" height="10">
                                    <div class="card-selector-comment_body">
                                        <div class="card-selector-comment_img"><img src="assets/comment-expanded.svg" width="15" height="15"></div>
                                        <div class="card-selector-comment_text">${event.target.comment}</div>
                                    </div>`;
	event.target.appendChild(commentDiv);
}

function cardCommentHide(event) {
	if (!event.target) {
		return;
	}

	event.target.childNodes.forEach((element) => {
		if (element.classList.contains("card-selector-comment")) {
			event.target.removeChild(element);
		}
	});
}

function cardOnDragStart(e) {
	draggedCards = getCardIdFromChildNode(this);

	command_name = "copy";
	if (this.classList.contains("slotWaiting")) {
		command_name = "w8_copy";
	}

	eventProperties = {
		event_name: "command",
		data: JSON.stringify({
			command_name: command_name,
			cells: draggedCards,
		}),
	};
	clickButton.click();

	this.style.opacity = "0.4";
}

function getEventProperties() {

	eventPropertiesReturn = eventProperties;
	eventProperties = {
		event_name: "",
		data: ""
	};

	return eventPropertiesReturn;
}

function cardOnDragEnd(e) {
	this.style.opacity = "1";
	//console.log('DragEnd', this);
}

function cardOnDragEnter(e) {
	//console.log('cardOnDragEnter')
	//document.getElementById(this.id.replace('slot_', '')).classList.add('card-selector-selected');
	//this.style.opacity = '1';
	// card-selector-selected
}

function cardOnDragLeave(e) {
	//console.log('cardOnDragLeave')
	//this.style.opacity = '1';
	//document.getElementById(this.id.replace('slot_', '')).classList.remove('card-selector-selected');
}

function cardOnDragOver(e) {
	e.preventDefault();
}

function cardOnDrop(e) {
	e.stopPropagation();

	let dropIds = getCardIdFromChildNode(this);

	eventProperties = {
		event_name: "command",
		data: JSON.stringify({
			command_name: "paste",
			cells: dropIds,
		}),
	};
	clickButton.click();
}

document.body.addEventListener("dblclick", function (evt) {
	clickButton.click();
});
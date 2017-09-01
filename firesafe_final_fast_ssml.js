'use strict';

exports.handler = function(event, context) {
	try {
		console.log("event.session.application.applicationId=" + event.session.application.applicationId);

		if (event.session.application.applicationId !== "amzn1.ask.skill.553227dd-624a-4328-b508-07f05a945ba0") {
			context.fail("Invalid Application ID");
		}

		if (event.session.new) {
			onSessionStarted({requestId: event.request.requestId}, event.session);
		}

		if (event.request.type === "LaunchRequest") {
			onLaunch(event.request, event.session, function callback(sessionAttributes, speechletResponse) {
				context.succeed(buildResponse(sessionAttributes, speechletResponse));
			});
		} else if (event.request.type === "IntentRequest") {
			onIntent(event.request, event.session, function callback(sessionAttributes, speechletResponse) {
				context.succeed(buildResponse(sessionAttributes, speechletResponse));
			});
		} else if (event.request.type === "SessionEndedRequest") {
			onSessionEnded(event.request, event.session);
		}
	} catch (e) {
		context.fail("Exception: " + e);
	}
};

function onSessionStarted(sessionStartedRequest, session) {
	console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId + ", sessionId=" + session.sessionId);
}

function onLaunch(launchRequest, session, callback) {
	console.log("onLaunch requestId=" + launchRequest.requestId + ", sessionId=" + session.sessionId);

	getWelcomeResponse(callback);
}

function onIntent(intentRequest, session, callback) {
	console.log("onIntent requestId=" + intentRequest.requestId + ", sessionId=" + session.sessionId);

	var intent = intentRequest.intent, intentName = intentRequest.intent.name;

	if (session.attributes && session.attributes.userPromptedToContinue) {
		delete session.attributes.userPromptedToContinue;
		if("AMAZON.NoIntent" === intentName) {
			handleFinishSessionRequest(intent, session, callback);
		} else if ("AMAZON.YesIntent" === intentName) {
			handleRepeatRequest(intent, session, callback);
		}
	}

	if ("YesNoIntent" === intentName) {
		handleYesNoRequest(intent, session, callback);
	} else if ("NumberIntent" === intentName) {
		handleNumberRequest(intent, session, callback);
	} else if ("PanicIntent" === intentName) {
		handlePanicRequest(intent, session, callback);
	} else if ("NextIntent" === intentName) {
		handleNextRequest(intent, session, callback);
	} else if ("EscapeIntent" === intentName) {
		handleEscapeRequest(intent, session, callback, " ");
	} else if ("AMAZON.RepeatIntent" === intentName) {
		handleRepeatRequest(intent, session, callback);
	} else if ("HereIntent" === intentName) {
		handleEscapeRequest(intent, session, callback, " ");
	} else if ("BlockedIntent" === intentName) {
		handleBlockedRequest(intent, session, callback);
	} else if ("SafeIntent" === intentName) {
		handleSafeRequest(intent, session, callback);
	} else if ("ExtingIntent" === intentName) {
		handleExtingRequest(intent, session, callback);
	} else if ("TrappedIntent" === intentName) {
		handleTrappedRequest(intent, session, callback);
	} else if ("AMAZON.StopIntent" === intentName) {
		handleFinishSessionRequest(intent, session, callback);
	} else {
		throw "Invalid Intent";
	}
}

function onSessionEnded(sessionEndedRequest, session) {
	console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId + ", sessionId=" + session.sessionId);
}

function getWelcomeResponse(callback) {
	var speechOutput = "Firesafe has detected a fire. Do you see flames?",
		reprompt = "Do you see flames?",
		shouldEndSession = false,

	sessionAttributes = {
		"speechOutput": speechOutput,
		"reprompt": reprompt,
		"prev": " ",
		"question": "flamesq",
		"floor": 0,
		"room": 0,
		"task": " ",
		"fireloc": "Jacobs209",
		"exits": ["exit1.1", "exit1.2", "stairs1.2", "exit2.1", "exit2.2", "exit2.3", "stairs2.1", "stairs2.2", "exit3.1", "exit3.2", "stairs3.1", "stairs3.2", "door220", "door210", "door110", "door120"],
		"seeflames": " ",
	};

	callback(sessionAttributes, buildSpeechletResponse(speechOutput, reprompt, shouldEndSession));
}

function parseOrd(ordinal) {
	var num = 0;
	switch(ordinal) {
		case "first":
		case "1st":
			num = 1;
			break;
		case "second":
		case "2nd":
			num = 2;
			break;
		case "3rd":
		case "third":
			num = 3;
			break;
		case "fourth":
		case "4th":
			num = 4;
			break;
		case "fifth":
		case "5th":
			num = 5;
			break;
		case "sixth":
		case "6th":
			num = 6;
			break;
		case "seventh":
		case "7th":
			num = 7;
			break;
		case "eight":
		case "8th":
			num = 8;
			break;
		case "ninth":
		case "9th":
			num = 9;
			break;
		case "tenth":
		case "10th":
			num = 10;
			break;
		default:
	}

	return num;
}

function handleYesNoRequest(intent, session, callback) {
	var speechOutput,
		reprompt = "Help is on its way. Take a deep breath and focus. ",
		prev = session.attributes.prev,
		question = session.attributes.question,
		floor = session.attributes.floor,
		room = session.attributes.room,
		task = session.attributes.task,
		fireloc = session.attributes.fireloc,
		response = intent.slots.response.value,
		exits = session.attributes.exits,
		seeflames = session.attributes.seeflames,
		shouldEndSession = false;

	prev = question;

	switch(question) {
		case "flamesq":
			switch(response) {
				case "yes":
					seeflames = "yes";
					break;
				case "no":
					seeflames = "no";
					break;
				default:
					handlePanicRequest(intent, session, callback);
			}
			speechOutput = "What floor are you on?";
			question = "floorq";
			break;
		case "tallerq":
			switch(response) {
				case "yes":
					handleEscapeRequest(intent, session, callback, " ");
					break;
				case "no":
					// fire extinguisher directions
					handleExtingRequest(intent, session, callback);
					break;
				default:
					//panic response
					handlePanicRequest(intent, session, callback);
			}
			break;
		case "doorq":
			switch(response) {
				case "yes":
					//trapped directions
					handleTrappedRequest(intent, session, callback);
					break;
				case "no":
					//escape directions
					handleEscapeRequest(intent, session, callback, " ");
					break;
				default:
					handlePanicRequest(intent, session, callback);
					//panic response
			}
			break;
		case "extingq":
			switch(response) {
				case "yes":
					speechOutput = "Find the pin on the base of the nozzle. When you are done, say next.";
					question = "extingpin";
					break;
				case "no":
					handleEscapeRequest(intent, session, callback, "You need to exit the building.");
					break;
				default:
					//panic response
					handlePanicRequest(intent, session, callback);
			}
			break;
		case "outq":
			switch(response) {
				case "yes":
					speechOutput = "Good job. Stay safe to prevent future fires. Goodbye!";
					shouldEndSession = true;
					//exit program
					break;
				case "no":
					speechOutput = "You need to exit the building. ";
					handleEscapeRequest(intent, session, callback, speechOutput);
					// escape directions
					break;
				default:
					//repeat or panic response
					handlePanicRequest(intent, session, callback);
			}
			break;
		case "getladder":
			switch(response) {
				case "yes":
					speechOutput = "Locate the red colored rung on the ladder. Place this rung out the window. When you are done, say next.";
					question = "redrung";
					break;
				case "no":
					handleTrappedRequest(intent, session, callback);
					break;
				default:
					//panic response
					handlePanicRequest(intent, session, callback);
			}
			break;
		default:
			// panic response?
			handlePanicRequest(intent, session, callback);
	}

	reprompt += speechOutput;

	var sessionAttributes = {
		"speechOutput": speechOutput,
		"reprompt": reprompt,
		"prev": prev,
		"question": question,
		"floor": floor,
		"room": room,
		"task": task,
		"fireloc": fireloc,
		"exits": exits,
		"seeflames": seeflames,
	};

	callback(sessionAttributes, buildSpeechletResponse(speechOutput, reprompt, shouldEndSession));
}

function handleNumberRequest(intent, session, callback) {
	var speechOutput,
		reprompt = "Help is on its way. Take a deep breath and focus. ",
		prev = session.attributes.prev,
		question = session.attributes.question,
		floor = session.attributes.floor,
		room = session.attributes.room,
		task = session.attributes.task,
		fireloc = session.attributes.fireloc,
		loc = intent.slots.loc.value,
		ordinal = intent.slots.ordinal.value,
		exits = session.attributes.exits,
		number = intent.slots.number.value,
		seeflames = session.attributes.seeflames;

	prev = question;

	if (question === "floorq" && ((loc === "floor") || (loc === undefined))) {
		if (number !== undefined) {
			floor = number;
		} else if (ordinal !== undefined) {
			floor = parseOrd(ordinal);
		} else {
			handlePanicRequest(intent, session, callback);
		}

		if (seeflames === "yes") {
			speechOutput = "Are the flames taller than you?";
			question = "tallerq";
		} else if (seeflames === "no") {
			speechOutput = "Is the door to your room hot?";
			question = "doorq";
		} else handlePanicRequest(intent, session, callback);
		

	} else if (question === "roomq") {
		if ((number !== undefined) && ((loc === "room") || (loc === undefined))) {
			session.attributes.room = number;
		} else if (loc !== undefined) {
			console.log("room loc =" + loc);
			session.attributes.room = loc;
		} else if (ordinal !== undefined) {
			session.attributes.room = parseOrd(ordinal);
		} else {
			handlePanicRequest(intent, session, callback);
		}

		if (task === "exting") {
			handleExtingRequest(intent, session, callback);
		} else {
			session.attributes.question = "escape";
			handleEscapeRequest(intent, session, callback, " ");
		}
	} else {
		handlePanicRequest(intent, session, callback);
	}

	reprompt += speechOutput;

	var sessionAttributes = {
		"speechOutput": speechOutput,
		"reprompt": reprompt,
		"prev": prev,
		"question": question,
		"floor": floor,
		"room": room,
		"task": task,
		"fireloc": fireloc,
		"exits": exits,
		"seeflames": seeflames,
	};

	callback(sessionAttributes, buildSpeechletResponse(speechOutput, reprompt, false));

}

function handlePanicRequest(intent, session, callback) {
	var speechOutput = "Help is on its way. Take a deep breath and focus. ",
		reprompt,
		prev = session.attributes.prev,
		question = session.attributes.question,
		floor = session.attributes.floor,
		room = session.attributes.room,
		task = session.attributes.task,
		exits = session.attributes.exits,
		fireloc = session.attributes.fireloc, 
		seeflames = session.attributes.seeflames;

	switch(task) {
		case "exting":
			//resume extinguisher directions
			handleNextRequest(intent, session, callback);
			break;
		case "escape":
			if (question === "roomq") {
				speechOutput += "What room are you in? ";
			}
			handleEscapeRequest(intent, session, callback, speechOutput);
			break;
		case "trapped":
			handleTrappedRequest(intent, session, callback);
			break;
		default:
			speechOutput += "I can help you find an exit route or put out a small fire. What do you need help with?";
			
			reprompt += speechOutput;

			var sessionAttributes = {
				"speechOutput": speechOutput,
				"reprompt": reprompt,
				"prev": prev,
				"question": question,
				"floor": floor,
				"room": room,
				"task": task,
				"fireloc": fireloc,
				"exits": exits,
				"seeflames": seeflames,
			};

			callback(sessionAttributes, buildSpeechletResponse(speechOutput, reprompt, false));
	}
	
}

function handleNextRequest(intent, session, callback) {
	var speechOutput,
		reprompt = "Help is on its way. Take a deep breath and focus. ",
		prev = session.attributes.question,
		question = session.attributes.question,
		floor = session.attributes.floor,
		room = session.attributes.room,
		task = session.attributes.task,
		exits = session.attributes.exits,
		fireloc = session.attributes.fireloc, 
		seeflames = session.attributes.seeflames;

	prev = question;

	switch(question) {
		case "extingpin":
			speechOutput = "Aim the nozzle at the base of the fire. When you are done, say next.";
			question = "extingnozz";
			break;
		case "extingnozz": 
			speechOutput = "Squeeze the handle until the fire is out. Is the fire out?";
			question = "outq";
			break;
		case "redrung":
			speechOutput = "Slowly drop the ladder out the window. Guide it over the window sill until you come to the end. When you are done, say next.";
			question = "dropladder";
			break;
		case "dropladder":
			speechOutput = "Place the ladder hooks firmly over the window sill. The weight of the ladder will keep it in place. When you are done, say next.";
			question = "hooks";
			break;
		case "hooks":
			speechOutput = "Climb down to the ground. Tell me when you are safe.";
			question = "ground";
			break;
		default:
			handlePanicRequest(intent, session, callback);
	}

	reprompt += speechOutput;

	var sessionAttributes = {
		"speechOutput": speechOutput,
		"reprompt": reprompt,
		"prev": prev,
		"question": question,
		"floor": floor,
		"room": room,
		"task": task,
		"fireloc": fireloc,
		"exits": exits,
		"seeflames": seeflames,
	};

	callback(sessionAttributes, buildSpeechletResponse(speechOutput, reprompt, false));

}

function handleEscapeRequest(intent, session, callback, speechOutput) {
	var reprompt = "Help is on its way. Take a deep breath and focus. ",
		fireloc = session.attributes.fireloc,
		prev = session.attributes.prev,
		question = session.attributes.question,
		floor = session.attributes.floor,
		room = session.attributes.room,
		exits = session.attributes.exits,
		task = session.attributes.task,
		seeflames = session.attributes.seeflames;

	prev = question;

	if (task != "escape") {
		speechOutput += " Starting exit directions. Tell me at any time if your exit is blocked. ";
		task = "escape";
		question = "escape";
		if (room === 0) {
			speechOutput += "What room are you in? ";
			question = "roomq";
		}
	} 

	switch(question) {
		case "roomq":
			break;
		case "escape":
		//beginning the escape dialog
			switch(fireloc) {
				//use fire location to find initial step of exit route
				case "Jacobs209":
					exits.splice(exits.indexOf("exit2.2"), 1);
					
					break;
				default:
					handlePanicRequest(intent, session, callback);
			}
			switch(room) {
				//use users room to find appropriate route
				case "209":
					if (exits.indexOf("exit2.2") >= 0) {
						question = "exit2.2";
						speechOutput += "Walk out your room and take the exit to your right. Tell me when you have safely left the building.";
					} else {
						handleTrappedRequest(intent, session, callback);
					}
					break;
				case "210":
				case "210A":
				case "210B":
				case "210C":
					if (exits.indexOf("door210") >= 0) {
						question = "door210";
						speechOutput += "Proceed to the exit door next to 210A. Tell me when you have arrived.";
					} else {
						handleTrappedRequest(intent, session, callback);
					}
					break;
				case "220":
				case "220A":
				case "220B":
				case "220C":
					if (exits.indexOf("door220") >= 0) {
						question = "door220";
						speechOutput += "Proceed to the exit door next to 220A. Tell me when you have arrived.";
					} else {
						handleTrappedRequest(intent, session, callback);
					}
					break;
				case "234":
					if (exits.indexOf("exit2.3") >= 0) {
						question = "exit2.3";
						speechOutput += "Walk out your room and proceed to the exit to your right. Tell me when you have safely left the building.";
					} else {
						handleTrappedRequest(intent, session, callback);
					}
					break;
				case "310":
					if (exits.indexOf("exit3.1") >= 0) {
						question = "exit3.1";
						speechOutput += "Proceed to the west exit door. Tell me when you have arrived. ";
					} else if (exits.indexOf("exit3.2") >= 0) {
						question = "exit3.2";
						speechOutput += "Proceed to the east exit door. Tell me when you have arrived.";
					} else {
						handleTrappedRequest(intent, session, callback);
					}
					break;
				case "110":
					if (exits.indexOf("door110") >= 0) {
						question = "door110";
						speechOutput += "Proceed to the exit door next to 110A. Tell me when you have arrived.";
					} else {
						handleTrappedRequest(intent, session, callback);
					}
					break;
				case "120":
					if (exits.indexOf("door120") >= 0) {
						question = "door120";
						speechOutput += "Proceed to the exit door next to 120A. Tell me when you have arrived.";
					} else {
						handleTrappedRequest(intent, session, callback);
					}
					break;
				case "lobby":
					if (exits.indexOf("exit2.3") >= 0) {
						question = "exit2.3";
						speechOutput += "Proceed to the exit door in front of you. Tell me when you have safely left the building.";
					} else {
						handleTrappedRequest(intent, session, callback);
					}
					break;
				case "bathroom":
				case "womens bathroom":
				case "mens bathroom":
					if (exits.indexOf("exit2.2") >= 0) {
						question = "exit2.2";
						speechOutput += "Exit the bathroom and turn right. Proceed to the exit door. Tell me when you have safely left the building.";
					} else if (exits.indexOf("stairs2.1") >= 0) {
						question = "stairs2.1";
						speechOutput += "Exit the bathroom and walk left until you reach the stairs. Tell me when you have arrived.";
					} else {
						handleTrappedRequest(intent, session, callback);
					}
					break;
				default:
					handlePanicRequest(intent, session, callback);
			}
			break;
		// following cases are used when user has already begun escape dialog
		case "door210":
			if (exits.indexOf("stairs2.1") >= 0) {
				question = "stairs2.1";
				speechOutput += "Take the stairs in front of you down one level. Tell me when you have arrived on level 1.";
			} else if (exits.indexOf("exit2.2") >= 0) {
				question = "exit2.2";
				speechOutput += "Turn left and proceed straight to the exit in front of you. Tell me when you have safely left the building.";
			} else {
				handleTrappedRequest(intent, session, callback);
			}	
			break;
		case "door220":
			if (exits.indexOf("exit2.3") >= 0) {
				question = "exit2.3";
				speechOutput += "Turn right and there will be an exit door on your left. Tell me when you have safely left the building.";
			} else {
				handleTrappedRequest(intent, session, callback);
			}
			break;
		case "stairs2.1":
			if (exits.indexOf("exit1.1") >= 0) {
				question = "exit1.1";
				speechOutput += "There is an exit door to your left. Tell me when you have safely left the building.";
			} else if (exits.indexOf("exit1.2") >= 0) {
				question = "exit1.2";
				speechOutput += "Walk to your right and there will be an exit on your right. Tell me when you have safely left the building.";
			} else {
				handleTrappedRequest(intent, session, callback);
			}
			break;
		case "exit3.1":
			if (exits.indexOf("stairs3.1") >= 0) {
				question = "stairs3.1";
				speechOutput += "Take the stairs in front of you down one level. Tell me when you are on the second floor.";
			} else if (exits.indexOf("exit3.2") >= 0) {
				question = "exit3.2";
				speechOutput += "Proceed through room 310 to the east exit door. Tell me when you have arrived.";
			} else {
				handleTrappedRequest(intent, session, callback);
			}
			break;
		case "exit3.2":
			if (exits.indexOf("stairs3.2") >= 0) {
				question = "stairs3.2";
				speechOutput += "Take the stairs in front of you down one level. Tell me when you have arrived on the second floor.";
			} else if (exits.indexOf("exit3.1") >= 0) {
				question = "exit3.1";
				speechOutput += "Proceed through room 310 to the west exit door. Tell me when you have arrived.";
			} else {
				handleTrappedRequest(intent, session, callback);
			}
			break;
		case "door110":
			if (exits.indexOf("exit1.1") >= 0) {
				question = "exit1.1";
				speechOutput += "There is an exit door to your right. Tell me when you have safely left the building.";
			} else if (exits.indexOf("exit1.2") >= 0) {
				question = "exit1.2";
				speechOutput += "Walk to your left and there will be an exit on your right. Tell me when you have safely left the building.";
			} else {
				handleTrappedRequest(intent, session, callback);
			}
			break;
		case "door120":
			if (exits.indexOf("stairs1.2") >= 0) {
				question = "stairs1.2";
				speechOutput += "Take the stairs in front of you up one level. Tell me when you have arrived on the second floor.";
			} else {
				handleTrappedRequest(intent, session, callback);
			}
			break;
		case "stairs3.1":
			if (exits.indexOf("stairs2.1") >= 0) {
				question = "stairs2.1";
				speechOutput += "Take the stairs down to the first floor. Tell me when you have arrived.";
			} else {
				handleTrappedRequest(intent, session, callback);
			}
			break;
		case "stairs3.2":
			if (exits.indexOf("exit2.3") >= 0) {
				question = "exit2.3";
				speechOutput += "Turn left and there will be an exit door on your left. Tell me when you have safely left the building.";
			} else {
				handleTrappedRequest(intent, session, callback);
			}
			break;
		case "stairs1.2":
			if (exits.indexOf("exit2.3") >= 0) {
				question = "exit2.3";
				speechOutput += "Turn left and there will be an exit door on your left. Tell me when you have safely left the building.";
			} else {
				handleTrappedRequest(intent, session, callback);
			}
			break;
		default:
			handlePanicRequest(intent, session, callback);
	}

	reprompt += speechOutput;

	var sessionAttributes = {
		"speechOutput": speechOutput,
		"reprompt": reprompt,
		"prev": prev,
		"question": question,
		"floor": floor,
		"room": room,
		"task": task,
		"fireloc": fireloc,
		"exits": exits,
		"seeflames": seeflames,
	};

	callback(sessionAttributes, buildSpeechletResponse(speechOutput, reprompt, false));

}

function handleRepeatRequest(intent, session, callback) {

	if (!session.attributes || !session.attributes.speechOutput) {
        getWelcomeResponse(callback);
    } else {
        callback(session.attributes,
            buildSpeechletResponse(session.attributes.speechOutput, "", false));
    }
}

function handleBlockedRequest(intent, session, callback) {
	var speechOutput,
		reprompt,
		prev = session.attributes.prev,
		question = session.attributes.question,
		floor = session.attributes.floor,
		room = session.attributes.room,
		task = session.attributes.task,
		exits = session.attributes.exits,
		fireloc = session.attributes.fireloc,
		seeflames = session.attributes.seeflames;


		exits.splice(exits.indexOf(question), 1);
		session.attributes.question = prev;


		handleEscapeRequest(intent, session, callback, " ");

}

function handleSafeRequest(intent, session, callback) {
	var speechOutput,
		reprompt,
		prev = session.attributes.prev,
		question = session.attributes.question,
		floor = session.attributes.floor,
		room = session.attributes.room,
		task = session.attributes.task,
		exits = session.attributes.exits,
		fireloc = session.attributes.fireloc,
		seeflames = session.attributes.seeflames;

		speechOutput = "Get as far away from the building as possible. Help is on its way. ";

	var sessionAttributes = {
		"speechOutput": speechOutput,
		"reprompt": reprompt,
		"prev": prev,
		"question": question,
		"floor": floor,
		"room": room,
		"task": task,
		"fireloc": fireloc,
		"exits": exits,
		"seeflames": seeflames,
	};

	callback(sessionAttributes, buildSpeechletResponse(speechOutput, reprompt, true));

}

function handleTrappedRequest(intent, session, callback) {
	var speechOutput,
		reprompt = "Help is on its way. Take a deep breath and focus. ",
		prev = session.attributes.prev,
		question = session.attributes.question,
		floor = session.attributes.floor,
		room = session.attributes.room,
		task = session.attributes.task,
		exits = session.attributes.exits,
		fireloc = session.attributes.fireloc,
		seeflames = session.attributes.seeflames,
		shouldEndSession = false;

	speechOutput = "Keep your door closed. If possible, put a damp cloth under the door and over your mouth. ";
	
	if ((floor < 4) & (floor > 1) & (question != "getladder")) {
		speechOutput += "There is an escape ladder to your left. Can you retrieve it?";
		question = "getladder";
	} else {
		speechOutput += "Stay in your room and stay low. Help is on its way.";
		shouldEndSession = true;
	}
	
	task = "trapped";

	reprompt += speechOutput;

	var sessionAttributes = {
		"speechOutput": speechOutput,
		"reprompt": reprompt,
		"prev": prev,
		"question": question,
		"floor": floor,
		"room": room,
		"task": task,
		"fireloc": fireloc,
		"exits": exits,
		"seeflames": seeflames,
	};

	callback(sessionAttributes, buildSpeechletResponse(speechOutput, reprompt, shouldEndSession));
}

function handleExtingRequest(intent, session, callback) {
	var speechOutput,
		reprompt = "Help is on its way. Take a deep breath and focus. ",
		prev = session.attributes.prev,
		question = session.attributes.question,
		floor = session.attributes.floor,
		room = session.attributes.room,
		task = session.attributes.task,
		exits = session.attributes.exits,
		fireloc = session.attributes.fireloc,
		shouldEndSession = false,
		seeflames = session.attributes.seeflames,
		exting_loc;

	task = "exting";

	if (room === 0) {
		question = "roomq";
		speechOutput = "What room are you in?";
	} else {
		switch(room) {
			case "209":
			case "210":
				exting_loc = "against the west wall in room 210.";
				break;
			case "210A":
			case "210B":
			case "210C":
				exting_loc = "in room 210C.";
				break;
			case "220":
				exting_loc = "against the east wall in room 220.";
				break;
			case "220A":
			case "220B":
			case "220C":
			case "234":
				exting_loc = "in room 220C.";
				break;
			default:
				exting_loc = "against the west wall in room 210.";
		}	

		speechOutput = "There is a fire extinguisher " + exting_loc + " Can you retrieve it?";
		question = "extingq";
	}

	reprompt += speechOutput;

	var sessionAttributes = {
		"speechOutput": speechOutput,
		"reprompt": reprompt,
		"prev": prev,
		"question": question,
		"floor": floor,
		"room": room,
		"task": task,
		"fireloc": fireloc,
		"exits": exits,
		"seeflames": seeflames,
	};

	callback(sessionAttributes, buildSpeechletResponse(speechOutput, reprompt, shouldEndSession));
}

function handleFinishSessionRequest(intent, session, callback) {

    callback(session.attributes,
        buildSpeechletResponse("Good bye!", "", true));
}

function buildSpeechletResponse(output, repromptText, shouldEndSession) {
	return {
		outputSpeech: {
			type: "SSML",
			ssml: "<speak><prosody rate=\"115%\">" + output + "</prosody></speak>"
		},
		reprompt: {
			outputSpeech: {
				type: "SSML",
				ssml: "<speak><prosody rate=\"115%\">" + repromptText + "</prosody></speak>"
			}
		},
		card: {
            type: "Simple",
            title: "FireSafe",
            content: output
        },
		shouldEndSession: shouldEndSession
	};
}

function buildResponse(sessionAttributes, speechletResponse) {
	return {
		version: "1.0",
		sessionAttributes: sessionAttributes,
		response: speechletResponse
	};
}
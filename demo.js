
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";

var graphData = [ ];

var ehrIDs = [ ];

function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}

function runCreateUsers() {
	sessionId = getSessionId();

	$.when(createTestUsers("janez", "novak", "1938-10-11T14:58"), createTestUsers("marko", "testni", "1993-11-30T11:11"), createTestUsers("jure", "medved", "1993-07-22T15:26")).done(function(){
		addVitalSignstoTestUsers(ehrIDs[0], "2014-12-19T12:20Z", 183, 85, 36.55, 122, 95, 100, "test");
		addVitalSignstoTestUsers(ehrIDs[1], "2014-10-22T22:30Z", 190, 90, 37.55, 115, 90, 95, "test2");
		addVitalSignstoTestUsers(ehrIDs[2], "2014-11-05T15:12Z", 175, 65, 36.20, 115, 90, 105, "test4");
		for(i=0; i<3; i++) {
			for(j=0; j<7; j++) {
				switch (i) {
					case 0:
						weight = (Math.random() * 10 + 78).toFixed(1);
						addWeight(ehrIDs[i], weight);
						break;
					case 1:
						weight = (Math.random() * 11 + 85).toFixed(1);
						addWeight(ehrIDs[i], weight);
						break;
					case 2:
						weight = (Math.random() * 12 + 60).toFixed(1);
						addWeight(ehrIDs[i], weight);
						break;
				}
			}
		}
	});

	//createGraph();

}

function createGraph() {
	var margin = {top: 40, right: 20, bottom: 30, left: 40},
		width = screen.width/2 - 60 - margin.left - margin.right,
		height = 500 - margin.top - margin.bottom;

	var x = d3.scale.ordinal()
		.rangeRoundBands([0, width], .1);

	var y = d3.scale.linear()
		.range([height, 0]);
		//.range([0, 100])

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom");

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left")
		//.range([0, 100])
		//.tickFormat(formatPercent);

	var tip = d3.tip()
		.attr('class', 'd3-tip')
		.offset([-10, 0])
		.html(function(d) {
			return "<strong>Teza:</strong> <span style='color:Green'>" + d.frequency + "</span>";
		})

	var svg = d3.select("#graphWeight").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	svg.call(tip);

		x.domain(graphData.map(function(d) { return d.letter; }));
		y.domain([0, d3.max(graphData, function(d) { return d.frequency; })]);

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis);

		svg.append("g")
			.attr("class", "y axis")
			.call(yAxis)
			.append("text")
			//.attr("transform", "rotate(-90)")
			.attr("y", -20)
			.attr("dy", ".71em")
			//.style("text-anchor", "end")
			.text("Teza");

		svg.selectAll(".bar")
			.data(graphData)
			.enter().append("rect")
			.attr("class", "bar")
			.attr("x", function(d) { return x(d.letter); })
			.attr("width", x.rangeBand())
			.attr("y", function(d) { return y(d.frequency); })
			.attr("height", function(d) { return height - y(d.frequency); })
			.on('mouseover', tip.show)
			.on('mouseout', tip.hide)



	function type(d) {
		d.frequency = +d.frequency;
		return d;
	}
}

function createTestUsers(ime, priimek, datumRojstva) {
	sessionId = getSessionId();

	$.ajaxSetup({
		headers: {"Ehr-Session": sessionId}
	});
	$.ajax({
		url: baseUrl + "/ehr",
		type: 'POST',
		async: false,
		success: function (data) {
			var ehrId = data.ehrId;
			var partyData = {
				firstNames: ime,
				lastNames: priimek,
				dateOfBirth: datumRojstva,
				partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
			};
			return $.ajax({
				url: baseUrl + "/demographics/party",
				type: 'POST',
				async: false,
				contentType: 'application/json',
				data: JSON.stringify(partyData),
				success: function (party) {
					if (party.action == 'CREATE') {
						$("#kreirajSporocilo").html("<span class='obvestilo label label-success fade-in'>Uspešno kreirani EHR zapisi</span>");
						//console.log("Uspešno kreiran EHR zapis " + ehrId + "'.");
						ehrIDs[ehrIDs.length] = ehrId;
						console.log(ehrIDs[ehrIDs.length-1]);
					}
				},
				error: function(err) {
					//$("#kreirajSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
					console.log(JSON.parse(err.responseText).userMessage);
				}
			});
		}
	});

}

function kreirajEHRzaBolnika() {
	sessionId = getSessionId();

	var ime = $("#kreirajIme").val();
	var priimek = $("#kreirajPriimek").val();
	var datumRojstva = $("#kreirajDatumRojstva").val();

	if (!ime || !priimek || !datumRojstva || ime.trim().length == 0 || priimek.trim().length == 0 || datumRojstva.trim().length == 0) {
		$("#kreirajSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		$.ajax({
		    url: baseUrl + "/ehr",
		    type: 'POST',
		    success: function (data) {
		        var ehrId = data.ehrId;
		        var partyData = {
		            firstNames: ime,
		            lastNames: priimek,
		            dateOfBirth: datumRojstva,
		            partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
		        };
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {
		                if (party.action == 'CREATE') {
		                    $("#kreirajSporocilo").html("<span class='obvestilo label label-success fade-in'>Uspešno kreirani EHR '" + ehrId + "'.</span>");
		                    console.log("Uspešno kreiran EHR '" + ehrId + "'.");
		                    $("#preberiEHRid").val(ehrId);
							ehrIDs.push($("#preberiEHRid").val(ehrId));
							//$('#prikaziIbranegaBolnika').append('<option value="janez,novak,1938-10-11T14:58">Janez Novak</option>');
							//$('#prikaziIbranegaBolnika').html('<option value="janez,novak,1938-10-11T14:58">Janez Novak</option>');
							//$('#prikaziIbranegaBolnika').selec('refresh');

		                }
		            },
		            error: function(err) {
		            	$("#kreirajSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
		            	console.log(JSON.parse(err.responseText).userMessage);
		            }
		        });
		    }
		});
	}
}

function preberiEHRodBolnika() {
	sessionId = getSessionId();

	var ehrId = $("#preberiEHRid").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#preberiSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#preberiSporocilo").html("<span class='obvestilo label label-success fade-in'>Bolnik '" + party.firstNames + " " + party.lastNames + "', ki se je rodil '" + party.dateOfBirth + "'.</span>");
				console.log("Bolnik '" + party.firstNames + " " + party.lastNames + "', ki se je rodil '" + party.dateOfBirth + "'.");
			},
			error: function(err) {
				$("#preberiSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
				console.log(JSON.parse(err.responseText).userMessage);
			}
		});
	}	
}

function addVitalSignstoTestUsers (ehrID, ura, telVis, telTez, telTemp, sisTlak, diaTlak, oVKrvi, mer) {
	sessionId = getSessionId();

	console.log("ehr ID: " + ehrID);

	$.ajaxSetup({
		headers: {"Ehr-Session": sessionId}
	});
	var data = {
		"ctx/language": "en",
		"ctx/territory": "SI",
		"ctx/time": ura,
		"vital_signs/height_length/any_event/body_height_length": telVis,
		"vital_signs/body_weight/any_event/body_weight": telTez,
		"vital_signs/body_temperature/any_event/temperature|magnitude": telTemp,
		"vital_signs/body_temperature/any_event/temperature|unit": "°C",
		"vital_signs/blood_pressure/any_event/systolic": sisTlak,
		"vital_signs/blood_pressure/any_event/diastolic": diaTlak,
		"vital_signs/indirect_oximetry:0/spo2|numerator": oVKrvi
	};
	var param = {
		"ehrId": ehrID,
		templateId: 'Vital Signs',
		format: 'FLAT',
		committer: mer
	};
	$.ajax({
		url: baseUrl + "/composition?" + $.param(param),
		type: 'POST',
		contentType: 'application/json',
		data: JSON.stringify(data),
		success: function (res) {
			console.log(res.meta.href);
			$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-success fade-in'>" + res.meta.href + ".</span>");
		},
		error: function(err) {
			$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
			console.log(JSON.parse(err.responseText).userMessage);
		}
	});


}

function addWeight(ehrID, telTeza){
	sessionId = getSessionId();

	console.log("add weight for: " + ehrID );

	$.ajaxSetup({
		headers: {"Ehr-Session": sessionId}
	});
	var data = {
		"ctx/language": "en",
		"ctx/territory": "SI",
		"ctx/time": "2014-11-21T11:40Z",
		"vital_signs/body_weight/any_event/body_weight": telTeza
	};
	var param = {
		"ehrId": ehrID,
		templateId: 'Vital Signs',
		format: 'FLAT',
		committer: "janez"
	};
	$.ajax({
		url: baseUrl + "/composition?" + $.param(param),
		type: 'POST',
		contentType: 'application/json',
		data: JSON.stringify(data),
		success: function (res) {
			console.log("added weith for : " + ehrID + " teza: " + telTeza);
			//$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-success fade-in'>" + res.meta.href + ".</span>");
		},
		error: function(err) {
			//$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
			console.log(JSON.parse(err.responseText).userMessage);
		}
	});
}

function dodajMeritveVitalnihZnakov() {
	sessionId = getSessionId();

	var ehrId = $("#dodajVitalnoEHR").val();
	var datumInUra = $("#dodajVitalnoDatumInUra").val();
	var telesnaVisina = $("#dodajVitalnoTelesnaVisina").val();
	var telesnaTeza = $("#dodajVitalnoTelesnaTeza").val();
	var telesnaTemperatura = $("#dodajVitalnoTelesnaTemperatura").val();
	var sistolicniKrvniTlak = $("#dodajVitalnoKrvniTlakSistolicni").val();
	var diastolicniKrvniTlak = $("#dodajVitalnoKrvniTlakDiastolicni").val();
	var nasicenostKrviSKisikom = $("#dodajVitalnoNasicenostKrviSKisikom").val();
	var merilec = $("#dodajVitalnoMerilec").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		var podatki = {
			// Preview Structure: https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
		    "ctx/language": "en",
		    "ctx/territory": "SI",
		    "ctx/time": datumInUra,
		    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
		   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
		    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
		    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
		    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
		};
		var parametriZahteve = {
		    "ehrId": ehrId,
		    templateId: 'Vital Signs',
		    format: 'FLAT',
		    committer: merilec
		};
		$.ajax({
		    url: baseUrl + "/composition?" + $.param(parametriZahteve),
		    type: 'POST',
		    contentType: 'application/json',
		    data: JSON.stringify(podatki),
		    success: function (res) {
		    	console.log(res.meta.href);
		        $("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-success fade-in'>" + res.meta.href + ".</span>");
		    },
		    error: function(err) {
		    	$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
				console.log(JSON.parse(err.responseText).userMessage);
		    }
		});
	}
}

function showResults() {
	sessionId = getSessionId();

	id = $("#prikaziIbranegaBolnika").val();

	if(id == -1)
		$("#noticePrikaziBolnika").html("<span class='obvestiloBolnik label label-warning fade-in'> Izberi bolnika!");
	else {
		var ehrId = ehrIDs[id];
		console.log("id: " + id + " klic showResults ehrId: " + ehrId);
		if(!ehrId) {
			$("#noticePrikaziBolnika").html("<span class='obvestiloBolnik label label-warning fade-in'> Dodaj testne uporabnike!");
		} else {
			$("#noticePrikaziBolnika").html("<span class='obvestiloBolnik label label-success fade-in'> Bolnik najden");

			var jqXHR = $.ajax({
				url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
				type: 'GET',
				headers: {"Ehr-Session": sessionId},
				success: function(data) {
					var parti = data.party;
					$("#informacijeObolniku").html("<span>Bolnik: <b>" + parti.firstNames + " " + parti.lastNames + "</b></span>");

					$.ajax({
						url: baseUrl + "/view/" + ehrId + "/" + "weight",
						type: 'GET',
						headers: {"Ehr-Session": sessionId},
						async: false,
						success: function(res) {
							if (res.length > 0) {
								for (i = 0; i<res.length; i++) {
									var teza = {letter: i+1, frequency: res[i].weight};
									graphData[i] = teza;
									console.log(graphData[i].letter + " " + graphData[i].frequency);
								}
							}
						}
					})
				}


			})



		}

	}

	jqXHR.done(function(){
		createGraph();
	});
}

function preberiMeritveVitalnihZnakov() {
	sessionId = getSessionId();	

	var ehrId = ehrIDs[$("#meritveVitalnihZnakovEHRid").val()];
	var tip = $("#preberiTipZaVitalneZnake").val();

	if (!ehrId || ehrId.trim().length == 0 || !tip || tip.trim().length == 0) {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
	    	type: 'GET',
	    	headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#rezultatMeritveVitalnihZnakov").html("<br/><span>Pridobivanje podatkov za <b>'" + tip + "'</b> bolnika <b>'" + party.firstNames + " " + party.lastNames + "'</b>.</span><br/><br/>");
				if (tip == "telesna temperatura") {
					$.ajax({
					    url: baseUrl + "/view/" + ehrId + "/" + "body_temperature",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-right'>Telesna temperatura</th></tr>";
						        for (var i in res) {
						            results += "<tr><td>" + res[i].time + "</td><td class='text-right'>" + res[i].temperature + " " 	+ res[i].unit + "</td>";
						        }
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
					    	} else {
					    		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
							console.log(JSON.parse(err.responseText).userMessage);
					    }
					});
				} else if (tip == "telesna teža") {
					$.ajax({
					    url: baseUrl + "/view/" + ehrId + "/" + "weight",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-right'>Telesna teža</th></tr>";
						        for (var i in res) {
						            results += "<tr><td>" + res[i].time + "</td><td class='text-right'>" + res[i].weight + " " 	+ res[i].unit + "</td>";
						        }
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
					    	} else {
					    		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
							console.log(JSON.parse(err.responseText).userMessage);
					    }
					});					
				} else if (tip == "telesna temperatura AQL") {
					var AQL = 
						"select " +
    						"t/data[at0002]/events[at0003]/time/value as cas, " +
    						"t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/magnitude as temperatura_vrednost, " +
    						"t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/units as temperatura_enota " +
						"from EHR e[e/ehr_id/value='" + ehrId + "'] " +
						"contains OBSERVATION t[openEHR-EHR-OBSERVATION.body_temperature.v1] " +
						"where t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/magnitude<35 " +
						"order by t/data[at0002]/events[at0003]/time/value desc " +
						"limit 10";
					$.ajax({
					    url: baseUrl + "/query?" + $.param({"aql": AQL}),
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	var results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-right'>Telesna temperatura</th></tr>";
					    	if (res) {
					    		var rows = res.resultSet;
						        for (var i in rows) {
						            results += "<tr><td>" + rows[i].cas + "</td><td class='text-right'>" + rows[i].temperatura_vrednost + " " 	+ rows[i].temperatura_enota + "</td>";
						        }
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
					    	} else {
					    		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
					    	}

					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
							console.log(JSON.parse(err.responseText).userMessage);
					    }
					});
				}
	    	},
	    	error: function(err) {
	    		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
				console.log(JSON.parse(err.responseText).userMessage);
	    	}
		});
	}
}

$(document).ready(function() {
	$('#preberiObstojeciEHR').change(function() {
		$("#preberiSporocilo").html("");
		$("#preberiEHRid").val($(this).val());
	});
	$('#preberiPredlogoBolnika').change(function() {
		$("#kreirajSporocilo").html("");
		var podatki = $(this).val().split(",");
		$("#kreirajIme").val(podatki[0]);
		$("#kreirajPriimek").val(podatki[1]);
		$("#kreirajDatumRojstva").val(podatki[2]);
	});
	$('#preberiObstojeciVitalniZnak').change(function() {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("");
		var podatki = $(this).val().split("|");
		$("#dodajVitalnoEHR").val(podatki[0]);
		$("#dodajVitalnoDatumInUra").val(podatki[1]);
		$("#dodajVitalnoTelesnaVisina").val(podatki[2]);
		$("#dodajVitalnoTelesnaTeza").val(podatki[3]);
		$("#dodajVitalnoTelesnaTemperatura").val(podatki[4]);
		$("#dodajVitalnoKrvniTlakSistolicni").val(podatki[5]);
		$("#dodajVitalnoKrvniTlakDiastolicni").val(podatki[6]);
		$("#dodajVitalnoNasicenostKrviSKisikom").val(podatki[7]);
		$("#dodajVitalnoMerilec").val(podatki[8]);
	});
	$('#preberiEhrIdZaVitalneZnake').change(function() {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("");
		$("#rezultatMeritveVitalnihZnakov").html("");
		$("#meritveVitalnihZnakovEHRid").val($(this).val());
	});
});

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
		addVitalSignstoTestUsers(ehrIDs[0], "2014-12-19T12:20Z", 183, 85, 36.55, 122, 95, 99.5, 80, "test");
		addVitalSignstoTestUsers(ehrIDs[1], "2014-10-22T22:30Z", 190, 90, 37.55, 115, 90, 95.66, 75, "test2");
		addVitalSignstoTestUsers(ehrIDs[2], "2014-11-05T15:12Z", 175, 65, 36.20, 115, 90, 90.32, 55, "test4");
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
						ehrIDs[ehrIDs.length] = ehrId;
						console.log(ehrIDs[ehrIDs.length-1]);
					}
				},
				error: function(err) {
					console.log(JSON.parse(err.responseText).userMessage);
				}
			});
		}
	});

}



function addVitalSignstoTestUsers (ehrID, ura, telVis, telTez, telTemp, sisTlak, diaTlak, oVKrvi, utrip, mer) {
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
		"vital_signs/indirect_oximetry:0/spo2|numerator": oVKrvi,
		"vital_signs/pulse/any_event/rate": utrip
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
		},
		error: function(err) {
			console.log(JSON.parse(err.responseText).userMessage);
		}
	});
}



function showResults() {
	sessionId = getSessionId();

	id = $("#prikaziIbranegaBolnika").val();
	var jqXHR=0;
	if(id == -1)
		$("#noticePrikaziBolnika").html("<span class='obvestiloBolnik label label-warning fade-in'> Izberi bolnika!");
	else {
		var ehrId = ehrIDs[id];
		console.log("id: " + id + " klic showResults ehrId: " + ehrId);
		if(!ehrId) {
			$("#noticePrikaziBolnika").html("<span class='obvestiloBolnik label label-warning fade-in'> Dodaj testne uporabnike!");
		} else {
			$("#noticePrikaziBolnika").html("<span class='obvestiloBolnik label label-success fade-in'> Bolnik najden");

				var AQL2 =
					"select " +
					"a_a/data[at0002]/events[at0003]/data[at0001]/items[at0004, 'Body weight']/value/magnitude as Body_weight_magnitude," +
					"e " +
					"from EHR e " +
					//"from EHR e[e/ehr_id/value='" + ehrId + "'] " +
					"contains COMPOSITION a " +
					"contains OBSERVATION a_a[openEHR-EHR-OBSERVATION.body_weight.v1] " +
					"where e/ehr_id/value matches {'" + ehrId + "'}" +
					"order by a_a/data[at0002]/events[at0003]/time/value desc " +
					"offset 0 limit 10 ";

				jqXHR = $.ajax({
					url: baseUrl + "/query?" + $.param({"aql": AQL2}),
					type: 'GET',
					headers: {"Ehr-Session": sessionId},
					success: function (res) {
						if (res) {
							var zadetki = res.resultSet;
							var j = 0;
							for (var i in zadetki) {
								var teza = {letter: j + 1, frequency: zadetki[j].Body_weight_magnitude};
								graphData[j] = teza;
								j++
							}
						}
					}
				});

			var tableData = "";
				$.ajax({
				url: window.location.href.substring(0,window.location.href.lastIndexOf('/') + 1) + "/javascripts/table.json",
				type: 'GET',
				async: false,
				success: function (res) {
					tableData = res;
				}
			});

			console.log("LAL: " + tableData);

		var izpis = "<table class='table table-hover'><thead><tr><th>Meritev</th><th>Izvidi</th></tr></thead><tbody>";
			addto =  $.ajax({
				url: baseUrl + "/view/" + ehrId + "/" + "body_temperature",
				type: 'GET',
				headers: {"Ehr-Session": sessionId},
				success: function (res) {
					var temp = res[res.length-1].temperature;
					console.log("dobljena temp:" + temp );
					if(temp < tableData.bodyTemp.low)
						"<tr class='danger'><td>Telesna temperatura</td><td> " + temp + "</td></tr>";
					else if(temp > tableData.bodyTemp.high)
						"<tr class='warning'><td>Telesna temperatura</td><td> " + temp + "</td></tr>";
					else
						izpis +="<tr class='success'><td>Telesna temperatura</td><td> " + temp + "</td>";
				}
			});

			var addto2 = $.ajax({
				url: baseUrl + "/view/" + ehrId + "/" + "weight",
				type: 'GET',
				headers: {"Ehr-Session": sessionId},
				success: function (res) {
					  $.ajax({
						url: baseUrl + "/view/" + ehrId + "/" + "height",
						type: 'GET',
					    async: false,
						headers: {"Ehr-Session": sessionId},
						success: function (res2) {
							bmi = res[res.length-1].weight / ((res2[res2.length-1].height/100) * (res2[res2.length-1].height/100));
							console.log("BMI:" + bmi);
							if(bmi <= tableData.bmi.underweight)
								izpis +="<tr class='info'><td>BMI index</td><td> " + bmi.toFixed(1) + "</td>";
							else if(bmi <= tableData.bmi.normalMax)
								izpis +="<tr class='success'><td>BMI index</td><td> " + bmi.toFixed(1) + "</td>";
							else if(bmi <= tableData.bmi.overweightMax)
								izpis +="<tr class='danger'><td>BMI index</td><td> " + bmi.toFixed(1) + "</td>";
							else
								izpis +="<tr class='warning'><td>BMI index</td><td> " + bmi.toFixed(1) + "</td>";
							console.log("laalaal")
						}
					});
				}
			});

			var addto3 = $.ajax({
				url: baseUrl + "/view/" + ehrId + "/" + "blood_pressure",
				type: 'GET',
				headers: {"Ehr-Session": sessionId},
				success: function (res) {
				var sis = res[res.length-1].systolic;
				var dia = res[res.length-1].diastolic;
				console.log("dia: " + dia + "  sis: " + sis);
					if(sis < tableData.bPressureSys.low)
						izpis+="<tr class='danger'><td>Sistolicni tlak</td><td>" + sis + "</td>";
					else if(sis > tableData.bPressureSys.high)
						izpis+="<tr class='danger'><td>Sistolicni tlak</td><td>" + sis + "</td>";
					else
						izpis+="<tr class='success'><td>Sistolicni tlak</td><td>" + sis + "</td>";

					if(dia < tableData.bPressureDia.low)
					 	izpis+="<tr class='danger'><td>Distolicni tlak</td><td>" + dia + "</td>";
					else if(dia > tableData.bPressureDia.high)
						izpis+="<tr class='danger'><td>Distolicni tlak</td><td>" + dia + "</td>";
					else
						izpis+="<tr class='success'><td>Distolicni tlak</td><td>" + dia + "</td>";
				}
			});

			var addto4 = $.ajax({
				url: baseUrl + "/view/" + ehrId + "/" + "spO2",
				type: 'GET',
				headers: {"Ehr-Session": sessionId},
				success: function (res) {
					var o2 = res[0].spO2;
					console.log("kisik in blood: " + o2);
					if(o2 < tableData.o2vKrvi.danger)
					 	izpis=+"<tr class='warning'> <td>Nasicenost s kisikom</td><td>" + o2 + "%</td>";
					else
						izpis+="<tr class='success'><td>Nasicenost s kisikom</td><td>" + o2 + "%</td>";

				}
			});



		addto.done(function(){
			addto2.done(function(){
				addto3.done(function(){
					addto4.done(function(){
						izpis += "</tbody></table>";
						$("#rezultatiMeritev").append(izpis);
					})
				})
			})
		})
		}

	}

	jqXHR.done(function(){
		createGraph();
	});
}

$(document).ready(function() {
	$('#prikaziIbranegaBolnika').change(function () {
		$('#noticePrikaziBolnika').html("");
		$('#informacijeObolniku').html("");
		$('#rezultatiMeritev').html("");
		$('#graphWeight').html("");
	});
});
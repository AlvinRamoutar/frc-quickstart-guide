var donePageInit = false;
var jsonData = null;

var pageIDs = ["firstRoboticsCompetition",
    "purposeOfGuide",
    "roboRIO",
    "pdp",
    "pcm",
    "vrm",
    "motorControllers",
    "otherNotables",
    "conclusion"];
var pageTitles = ["Home",
    "About Guide",
    "NI roboRIO",
    "Power Distribution Panel",
    "Pneumatics Control Module",
    "Voltage Regulator Module",
     "Motor Controllers",
    "Other Notables",
    "Conclusion"];

// Initialize
$(document).on("pageinit", function () {
    if (!donePageInit) {
        $.getJSON("quiz.json", function (data) {
            console.log(data);
            jsonData = data;
            initQuestionGenerator();
            console.log("Done loading questions");

            // If jsonData object exists in localstorage, then there are saved answers.
            //  Load em' up.
            let userAnswers = localStorage['FRCQuickstartGuide_QuizData'];
            if(userAnswers) {
                initLoadUserAnswers(JSON.parse(userAnswers));
                console.log("Done loading saved question data");
            }

            // Add clear saved answers functionality to knowledge quiz 'clear' buttons
            $("a.clearAllAnswers").on("click", function(e) {
                localStorage['FRCQuickstartGuide_QuizData'] = JSON.stringify(jsonData);
                location.reload(true);
            });
        });

        donePageInit = true;
    }
});

$(document).on("pagechange", function() {
    initFooterNavbar(pageIDs.indexOf($.mobile.activePage.attr("id")));
    $("select[name=select-page]").change(function(e) {
        console.log($("select[name=select-page] option:selected").text());
        let newPageID = pageIDs[pageTitles.indexOf($("select[name=select-page] option:selected").text())];
        //$("select[name=select-page] option:selected").val([]);
        $("." + $.mobile.activePage.attr("id") + "_pageSelector").val([]);
        $.mobile.navigate("#" + newPageID, {transition : "flip"});
    });
});


function initQuestionGenerator() {
    questionGenerator("roboRIO");
    questionGenerator("pdp");
    questionGenerator("pcm");
    questionGenerator("vrm");
    questionGenerator("motorControllers");
}

function questionGenerator(category) {
    // Compile templates
    let mc = Handlebars.compile($("#mc_q_template").html());
    let fitb = Handlebars.compile($("#fitb_q_template").html());
    let diag = Handlebars.compile($("#diag_q_template").html());

    for(let i = 0; i < jsonData[category].length; i++) {
        if(jsonData[category][i].type == "mc") {
            $("#" + category + "_questionBlock").append(mc(jsonData[category][i]));
        } else if(jsonData[category][i].type == "fillin") {
            $("#" + category + "_questionBlock").append(fitb(jsonData[category][i]));
        } else if(jsonData[category][i].type == "diagram") {
            $("#" + category + "_questionBlock").append(diag(jsonData[category][i]));
        }
        $("#" + category + "_questionBlock").trigger('create');
    }

    // Prepare quiz navbar
    quizNavbarInit(category);
}

function quizNavbarInit(category) {
    let options = Handlebars.compile($("#q_options_template").html());
    $("#" + category + "_quizOptionsBar").append(options(category));
    $("#" + category + "_quizOptionsBar").trigger('create');

    // Assign animation function to solution elements, trigger on event click for 'Check' button.
    $("#" + category + "_revealAnswers").on("click", function(e) {
        // Animate solution element on show
        let small = $("[id^=a_][id$=_" + category + "]");
        small.show("fast");
        small.animate({opacity: 0, color: 'darkgreen'}, "slow");
        small.animate({opacity: 1, color: 'limegreen'}, "slow");
    });

    // Assign save function to questions, trigger on event click for 'Save' button.
    $("#" + category + "_saveAnswers").on("click", function(e) {

        // Iterate through the quiz block on each page
        for(let i = 0; i < jsonData[category].length; i++) {

            // Clear array in existing jsonData object
            jsonData[category][i].userAnswer = [];

            // Depending on the question type, retrieve the answer from the
            //  form element differently. For instance, MCQ's have 1 answer,
            //  while diagramming questions have 4.
            if (jsonData[category][i].type == "mc") {
                jsonData[category][i].userAnswer.push(
                    $("[name=mc_" + category + "]:checked").prev().text()
                );
            } else if (jsonData[category][i].type == "fillin") {
                jsonData[category][i].userAnswer.push(
                    $("[name=fitb_" + category + "]").val()
                );
            } else if (jsonData[category][i].type == "diagram") {
                $("[name$=_diag_" + category + "]").each(function(e) {
                    jsonData[category][i].userAnswer.push(
                        $(this).val()
                    );
                });
            }
        }

        // Push jsonData object to localStorage.
        localStorage['FRCQuickstartGuide_QuizData'] = JSON.stringify(jsonData);
    });
}

function initLoadUserAnswers(uA) {
    loadUserAnswers(uA, "roboRIO");
    loadUserAnswers(uA, "pdp");
    loadUserAnswers(uA, "pcm");
    loadUserAnswers(uA, "vrm");
    loadUserAnswers(uA, "motorControllers");

    // Due to jQuery mobile styling, updates to radio groups aren't done on attribute change.
    // Thus, manual refresh of radio groups.
    $("input[type='radio']").checkboxradio("refresh");
}

function loadUserAnswers(uA, category) {
    // Iterate through the quiz block on each page
    for(let i = 0; i < uA[category].length; i++) {

        // Depending on the question type, retrieve the answer from the
        //  form element differently. For instance, MCQ's have 1 answer,
        //  while diagramming questions have 4.
        if (uA[category][i].type == "mc") {
            $("label:contains(" + uA[category][i].userAnswer[0] + ")").next().prop("checked", true);
            $("label:contains(" + uA[category][i].userAnswer[0] + ")").trigger('create');
        } else if (uA[category][i].type == "fillin") {
            $("input[name=fitb_" + category + "]").val(uA[category][i].userAnswer[0]);
        } else if (uA[category][i].type == "diagram") {
            $("[name$=_diag_" + category + "]").each(function(e) {
                $(this).val(uA[category][i].userAnswer[e]);
            });
        }
    }
}


function initFooterNavbar(i) {
    console.log("Initializing footers");
    let footer = Handlebars.compile($("#footer_template").html());
    let navHandlebarDataObj = {};

    if(i == 0) {
        navHandlebarDataObj["prevID"] = pageIDs[i];
        navHandlebarDataObj["prevTitle"] = pageTitles[i];
        navHandlebarDataObj["nextID"] = pageIDs[i + 1];
        navHandlebarDataObj["nextTitle"] = pageTitles[i + 1];
    } else if(i == pageIDs.length - 1) {
        navHandlebarDataObj["prevID"] = pageIDs[i - 1];
        navHandlebarDataObj["prevTitle"] = pageTitles[i - 1];
        navHandlebarDataObj["nextID"] = pageIDs[i];
        navHandlebarDataObj["nextTitle"] = pageTitles[i];
    } else {
        navHandlebarDataObj["prevID"] = pageIDs[i - 1];
        navHandlebarDataObj["prevTitle"] = pageTitles[i - 1];
        navHandlebarDataObj["nextID"] = pageIDs[i + 1];
        navHandlebarDataObj["nextTitle"] = pageTitles[i + 1];
    }

    navHandlebarDataObj["currentID"] = pageIDs[i];
    navHandlebarDataObj["currentTitle"] = pageTitles[i];

    navHandlebarDataObj["pageIDs"] = pageIDs;
    navHandlebarDataObj["pageTitles"] = pageTitles;

    $("footer[name=" + pageIDs[i] + "]").html(footer(navHandlebarDataObj)).trigger('create');
}
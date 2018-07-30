/**
 * Author:      Alvin Ramoutar
 * Date:        2018/08/03
 * Description: A simple jQuery Mobile site for info on FRC's Control System Hardware, 2018.
 *              Developed for Sheridan College, 2018.
 * File:        js/app.js
 *              Code-behind for site interactivity, mainly knowledge quiz.
 */

var donePageInit = false;
var jsonData = null;

/*
Storing page IDs and titles into arrays for use in navigation elements,
 notably the footer.
 */
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
    "PDP",
    "PCM",
    "VRM",
    "Motor Ctrl",
    "Others",
    "Conclusion"];

/*
Initialize
 Everything begins here.
 */
$(document).on("pageinit", function () {
    if (!donePageInit) {
        // JSON for knowledge quiz is retrieved.
        $.getJSON("quiz.json", function (data) {
            console.log(data);
            jsonData = data;

            // Next, questions are loaded into appropriate question blocks.
            initQuestionGenerator();
            console.log("Done loading questions");

            // If jsonData object exists in localstorage, then there are saved answers. Load them.
            let userAnswers = localStorage['FRCQuickstartGuide_QuizData'];
            if(userAnswers) {
                initLoadUserAnswers(JSON.parse(userAnswers));
                console.log("Done loading saved question data");
            }

            // Add clear saved answers functionality to knowledge quiz 'clear' buttons
            $("a.clearAllAnswers").on("click", function(e) {

                // Converting jsonData object to string, then storing into localStorage.
                //  Parsed when being read back in.
                localStorage['FRCQuickstartGuide_QuizData'] = JSON.stringify(jsonData);
                location.reload(true);
            });
        });

        donePageInit = true;
    }
});

/*
Adds mobile.navigate functionality to Go To select option.
Also performs call to initFooterNavbar, which creates fixed position footer navbar on bottom of page.
 */
$(document).on("pagechange", function() {
    initFooterNavbar(pageIDs.indexOf($.mobile.activePage.attr("id")));
    $("select[name=select-page]").change(function(e) {
        console.log($("select[name=select-page] option:selected").text());

        // Grab the ID from user selected page text by comparing indexes with pageIDs.
        let newPageID = pageIDs[pageTitles.indexOf($("select[name=select-page] option:selected").text())];

        $("." + $.mobile.activePage.attr("id") + "_pageSelector").val([]);
        $.mobile.navigate("#" + newPageID, {transition : "flip"});
    });
});

/*
Kick-starts knowledge quiz question generation.
Starts by compiling question type handlebars.
 */

// Handlebars
var mc_hb, fitb_hb, diag_hb = null;

function initQuestionGenerator() {
    if(mc_hb == null) {
        mc_hb = Handlebars.compile($("#mc_q_template").html());
        fitb_hb = Handlebars.compile($("#fitb_q_template").html());
        diag_hb = Handlebars.compile($("#diag_q_template").html());
    }

    questionGenerator("roboRIO");
    questionGenerator("pdp");
    questionGenerator("pcm");
    questionGenerator("vrm");
    questionGenerator("motorControllers");
}

/*
Compiles required handlebars, and creates the quiz options bar.
Type of questions are:
- mc (Multiple Choice, includes T/F)
- fillin (Single-field fill in the blank)
- diag (Diagram question, multiple fillin)
 */
function questionGenerator(category) {
    for(let i = 0; i < jsonData[category].length; i++) {
        if(jsonData[category][i].type == "mc") {
            $("#" + category + "_questionBlock").append(mc_hb(jsonData[category][i]));
        } else if(jsonData[category][i].type == "fillin") {
            $("#" + category + "_questionBlock").append(fitb_hb(jsonData[category][i]));
        } else if(jsonData[category][i].type == "diagram") {
            $("#" + category + "_questionBlock").append(diag_hb(jsonData[category][i]));
        }
        $("#" + category + "_questionBlock").trigger('create');
    }

    // Prepare quiz navbar
    quizNavbarInit(category);
}

/*
Options navbar for knowledge quiz.
Includes functionality to:
- Check (reveal answers)
- Save (saves answers to local storage)
- Clear (clears all answers from screen, and local storage)
 */
function quizNavbarInit(category) {
    // Compile and implement quiz options (navbar) handlebar element.
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

/*
Kick-starts process to load user answers from localstorage.
 */
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

/*
Loads user answers from localstorage.
Implements similar logic to questionGenerator, but populates elements instead of creates them.
 */
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

/*
Generates page footer bar.
Compiles footer handlebar, and populates appropriate navigation elements.
Next/Prev functionality is determined by navHandlebarDataObj, which is passed to every footer created.
 */
function initFooterNavbar(i) {
    console.log("Initializing footers");
    let footer = Handlebars.compile($("#footer_template").html());
    let navHandlebarDataObj = {};

    if(i == 0) { // First Page
        navHandlebarDataObj["prevID"] = pageIDs[i];
        navHandlebarDataObj["prevTitle"] = pageTitles[i];
        navHandlebarDataObj["nextID"] = pageIDs[i + 1];
        navHandlebarDataObj["nextTitle"] = pageTitles[i + 1];
    } else if(i == pageIDs.length - 1) { // Last Page
        navHandlebarDataObj["prevID"] = pageIDs[i - 1];
        navHandlebarDataObj["prevTitle"] = pageTitles[i - 1];
        navHandlebarDataObj["nextID"] = pageIDs[i];
        navHandlebarDataObj["nextTitle"] = pageTitles[i];
    } else { // All other pages
        navHandlebarDataObj["prevID"] = pageIDs[i - 1];
        navHandlebarDataObj["prevTitle"] = pageTitles[i - 1];
        navHandlebarDataObj["nextID"] = pageIDs[i + 1];
        navHandlebarDataObj["nextTitle"] = pageTitles[i + 1];
    }

    // Current page
    navHandlebarDataObj["currentID"] = pageIDs[i];
    navHandlebarDataObj["currentTitle"] = pageTitles[i];

    navHandlebarDataObj["pageIDs"] = pageIDs;
    navHandlebarDataObj["pageTitles"] = pageTitles;

    $("footer[name=" + pageIDs[i] + "]").html(footer(navHandlebarDataObj)).trigger('create');
}
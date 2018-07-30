var donePageInit = false;
var jsonData = null;

// Initialize
$(document).on("pageinit", function () {
    if (!donePageInit) {
        $.getJSON("quiz.json", function (data) {
            console.log(data);
            jsonData = data;
            initQuestionGenerator();
        });

        // If jsonData object exists in localstorage, then there are saved answers.
        //  Load em' up.
        let userAnswers = localStorage['FRCQuickstartGuide_QuizData'];
        if(userAnswers)
            initLoadUserAnswers(JSON.parse(userAnswers));

        donePageInit = true;
    }
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
            console.log(uA[category][i].userAnswer[0]);
            $("[name=fitb_" + category + "]").val(uA[category][i].userAnswer[0]);
        } else if (uA[category][i].type == "diagram") {
            $("[name$=_diag_" + category + "]").each(function(e) {
                jsonData[category][i].userAnswer.push(
                    $(this).val()
                );
            });
        }
    }
}
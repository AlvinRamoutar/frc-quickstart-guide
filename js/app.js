var donePageInit = false;
var jsonData = null;

$(document).on("pageinit", function () {

    if (!donePageInit) {
        $.getJSON("quiz.json", function (data) {
            console.log(data);
            jsonData = data;
            initQuestionGenerator();
        });
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
    for(var i = 0; i < jsonData[category].length; i++) {
        if(jsonData[category][i].type == "mc") {
            var mc = Handlebars.compile($("#mc_q_template").html());
            $("#" + category + "_questionBlock").append(mc(jsonData[category][i]));
        } else if(jsonData[category][i].type == "fillin") {
            var fitb = Handlebars.compile($("#fitb_q_template").html());
            $("#" + category + "_questionBlock").append(fitb(jsonData[category][i]));
        } else if(jsonData[category][i].type == "diagram") {
            var diag = Handlebars.compile($("#diag_q_template").html());
            $("#" + category + "_questionBlock").append(diag(jsonData[category][i]));
        }
        $("#" + category + "_questionBlock").trigger('create');
    }
}
function about(){
	var author = "Pragy Agarwal (agar.pragy@gmail.com)";
	var special_thanks = "Shyam Singh, Arjun Suresh";
	var source = "https://github.com/AgarwalPragy/GATE2016_MarksEvaluator";
}

function set_theme(){
	$(".radio").blur();
	var mytheme = "";
	if ($("#theme-light").is(":checked")){
		mytheme += "-light";
	}
	if(typeof(Storage) !== "undefined"){
		localStorage.setItem("theme", mytheme===""?"dark":"light");
	}
	$("#dynamic-css").attr("href", "visualizeMarks" + mytheme + ".css");
}

function change_interval(increase){
	if(!("interval_width" in window)) window.interval_width = 5;
	var interval = window.interval_width;
	var divisors = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30, 40, 60, 120];
	if(increase){
		if(interval===120) return;
		var index = divisors.indexOf(interval);
		window.interval_width = divisors[index+1];
	}
	else{
		if(interval===1) return;
		var index = divisors.indexOf(interval);
		window.interval_width = divisors[index-1];
	}
	$("#interval-width").html(window.interval_width);
	draw_graphs();
}

function calculate(){
	$(".radio").blur();
	var mymarks = $("#my-marks").val();
	if(isNaN(mymarks)) return;
	mymarks = parseFloat(mymarks);
	var set_num = 5;
	var set = window._set5;
	if ($("#radio2").is(":checked")){
		set = window._set6;
		set_num = 6;
	}
	var norm_marks = normalize_marks(mymarks, set.TopAvg01, set.SumMeanStd);
	norm_marks = norm_marks.toFixed(2);
	$("#normalized-marks").html(norm_marks);

	var score = calculate_score(norm_marks);
	$("#score").html(score);

	for (var i = 0; i < set.students.length; i++) {
		if(set.students[i].marks <= mymarks){
			$("#rank-set").html(i+1);
			break;
		}
	}
	for (var i = 0; i < window._all.students.length; i++) {
		if(window._all.students[i].set == set_num && window._all.students[i].marks <= mymarks){
			$("#rank-raw").html(i+1);
			break;
		}
	}
	for (var i = 0; i < window._all.students.length; i++) {
		if(window._all.students[i].normalized_marks <= norm_marks){
			$("#rank-normalized").html(i+1);
			break;
		}
	}
}

function str_bar(item, count, total, max){
	var width = parseInt(((count*95.0)/max).toFixed(0)) + 5;
	if(count === 0) width = 0;
	var bar = item + '&nbsp;<progress value="' + width + '" max="100" class="myprogress"></progress>&nbsp;' + pad(count) + '</span><br />';
	return bar;
}

function fillColumn(students, set_name){
	if(!("interval_width" in window)) window.interval_width = 5;
	var interval = window.interval_width;
	var num_buckets = parseInt(Math.ceil(120/interval).toFixed(0));
	var raw_counts = [];
	var normalized_counts = [];
	for (var i = 0; i < num_buckets; i++) {
		raw_counts.push(0);
		normalized_counts.push(0);
	}
	var raw_bucket = -1;
	var normalized_bucket = -1;
	var raw_max = -1;
	var normalized_max = -1;
	for (var i = 0; i < students.length; i++) {
		raw_bucket = Math.floor((students[i].marks + 20)/interval);
		raw_counts[raw_bucket] += 1;

		normalized_bucket = Math.floor((students[i].normalized_marks + 20)/interval);
		normalized_counts[normalized_bucket] += 1;

		raw_max = (raw_max>raw_counts[raw_bucket])?raw_max:raw_counts[raw_bucket];
		normalized_max = (normalized_max>normalized_counts[normalized_bucket])?normalized_max:normalized_counts[normalized_bucket];
	}
	var total = students.length;

	var raw_code = "";
	var normalized_code = "";
	for (var i = 0; i < raw_counts.length; i++) {
		var item = pad(i*interval-20) + ' - ' + pad(i*interval - 20 + interval);
		raw_code = raw_code + "\n" + str_bar(item , raw_counts[i], total, raw_max);
		normalized_code = normalized_code + "\n" + str_bar(item , normalized_counts[i], total, normalized_max);
	}
	$("#" + set_name + "-raw").html(raw_code);
	$("#" + set_name + "-normalized").html(normalized_code);
	$("#" + set_name + "-total").html("(" + total + ")");
}

function draw_graphs(){
	fillColumn(window._set5.students, "set5");
	fillColumn(window._set6.students, "set6");
	fillColumn(window._all.students, "all");
}

function pad(num){
	var num_str = '<span style="display: inline-block; width: 30px; text-align: right;">' + num + '</span>';
	return num_str;
}

/**
	Returns the average marks of top 1% candidates
	from the given array of students.
	Note, this should be 0.1%, but we don't have that many people.
*/
function top_avg(students){
	var len = students.length;
	var top01 = parseInt((len/100).toFixed(0));
	if(top01 < 1) top01 = 1;
	var sum = 0.0;
	for (var i = 0; i < top01; i++) {
		sum += students[i].marks;
	}
	return sum/top01;
}


/**
	Returns the sum of mean and standard deviation of all candidates
	from the given array of students.
*/
function sum_mean_std(students){
	var sum = 0.0;
	for (var i = 0; i < students.length; i++) {
		sum += students[i].marks;
	}
	var mean = sum/students.length;

	var net_deviation = 0.0;
	var deviation = 0.0;
	for (var i = 0; i < students.length; i++) {
		deivation = students[i].marks - mean;
		net_deviation += deivation*deivation;
	}
	var std = deviation/students.length;
	return mean+std;
}

function calculate_qualifyingmarks(){
	// http://www.gate.iisc.ernet.in/?page_id=1054
	window.qualifying_marks = (window._all.SumMeanStd>25)?window._all.SumMeanStd:25;
	window.qualifying_marks = parseFloat(window.qualifying_marks.toFixed(2));
	$("#qualifying-marks").html(window.qualifying_marks);
}

function calculate_score(norm_marks){
	// http://www.gate.iisc.ernet.in/?page_id=1054
	var score = 350.0 + ((900.0-350.0) * (norm_marks - window.qualifying_marks)) / (window._all.TopAvg01 - window.qualifying_marks);
	score = score>1000?1000:score;
	score = score.toFixed(2);
	return score;
}

function normalize_marks(marks, topAvg01, sum_mean_std){
	// http://www.gate.iisc.ernet.in/?page_id=1054
	return (
		(
			(window._all.TopAvg01 - window._all.SumMeanStd)
			/
			(topAvg01 - sum_mean_std)
		)
		*
		(marks - sum_mean_std)
		+
		window._all.SumMeanStd
	);
}

function populate_normalized_marks(students, topAvg01, sum_mean_std){
	for (var i = students.length - 1; i >= 0; i--) {
		/**
			Formula: http://www.gate.iisc.ernet.in/?page_id=1054
		*/
		students[i].normalized_marks = normalize_marks(students[i].marks, topAvg01, sum_mean_std);
		students[i].normalized_marks = parseFloat(students[i].normalized_marks.toFixed(2));
	}
}


function process_marks(){
	// Process the raw_data and populate all.students array
	window._all = {};
	window._set5 = {};
	window._set6 = {};
	window._all.students = [];
	var regex = /\((5|6),([\d\-.]+)\)/;
	for (var i = window.raw_data.length - 1; i >= 0; i--) {
		var set = 0;
		var marks = 0;
		var found = window.raw_data[i].match(regex);
		if(found && found.length >= 2){
			set = parseInt(found[1]);
			if(!(set===5 || set===6)) continue;
			marks = parseFloat(found[2]);
			window._all.students.push({
				set: set,
				marks: marks,
				normalized_marks: 0,
				rank: -1,
				normalized_rank: -1
			});
		}
	}
	// Sort descending. Makes it easy to process later.
	window._all.students.sort(function(a,b){
		return b.marks - a.marks;
	})
	// console.log(window._all.students);

	// We have the array for all.students.
	// Sieve this into an array for each set.
	// Both these arrays will automatically be sorted in descending order.
	window._set5.students = [];
	window._set6.students = [];
	for (var i = 0; i < window._all.students.length; i++) {
		if(window._all.students[i].set === 5)
			window._set5.students.push(window._all.students[i]);
		else
			window._set6.students.push(window._all.students[i]);
	}
	// The following is needed for normalization
	window._all.TopAvg01 = top_avg(window._all.students);
	window._set5.TopAvg01 = top_avg(window._set5.students);
	window._set6.TopAvg01 = top_avg(window._set6.students);

	window._all.SumMeanStd = sum_mean_std(window._all.students);
	window._set5.SumMeanStd = sum_mean_std(window._set5.students);
	window._set6.SumMeanStd = sum_mean_std(window._set6.students);

	// Calculate normalized marks for each candate
	populate_normalized_marks(window._set5.students, window._set5.TopAvg01, window._set5.SumMeanStd);
	populate_normalized_marks(window._set6.students, window._set6.TopAvg01, window._set6.SumMeanStd);

	// Sort descending by normalized marks.
	window._all.students.sort(function(a,b){
		return  b.normalized_marks - a.normalized_marks;
	})

	// Make some sexy graphs
	draw_graphs();

	// Calculate qualifying marks
	calculate_qualifyingmarks();
}

function do_initialize(){
    process_marks();
    calculate();
    if(typeof(Storage) !== "undefined"){
        var theme = localStorage.getItem("theme");
        $("#theme-" + theme).prop("checked", true);
        set_theme();
    }

    var stickyTop = $('#settings-box').offset().top;
    $(window).scroll(function(){
        var windowTop = $(window).scrollTop();
        if (stickyTop < windowTop){
            $('#settings-box').css({ position: 'fixed', top: 0 });
        }
        else{
            $('#settings-box').css('position','static');
        }
    });
}
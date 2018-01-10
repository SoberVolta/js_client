/**
 * Created by GrantBroadwater on 12/18/17.
 */

var ref = firebase.database().ref();
var provider = new firebase.auth.FacebookAuthProvider();
provider.addScope('public_profile');

var eventID = getEventID( window.location.href );

var rideStatus = undefined;
var RideNotRequested = -1;
var RideRequested = 0;
var RideActive = 1;

var userRideIDInEventQueue = undefined;

$.Topic( EventDoesExist ).subscribe( function( val ) {

    if ( !eventDoesExist ) {
        window.location.href = "/";
    }

});

$.Topic( EventNameDidChange ).subscribe( function( val ) {

    $(".titleText").text( eventName ? "" + eventName : "" );

});

$.Topic( EventLocationDidChange ).subscribe( function ( val ) {

    $(".supportingText").text( eventLocation ? "" + eventLocation : "" );

});

$.Topic( EventDisabledDidChange ).subscribe( function ( val ) {

    if( eventDisabled ) {
        window.location.href = "/";
    }

});

function updateRideStatusValue() {

    if ( userRides ) {

        var userRidesKeys = Object.keys(userRides);

        if ( eventQueue ) {

            var queueKeys = Object.keys( eventQueue );
            var overlap = intersection(queueKeys, userRidesKeys);

            if ( overlap.length > 0 ) {

                userRideIDInEventQueue = overlap[0];
                rideStatus = RideRequested;
                return;

            }
        }

        if ( eventActiveRides ) {

            var eventActiveRidesKeys = Object.keys(eventActiveRides);
            var overlap = intersection(userRidesKeys, eventActiveRidesKeys);

            if ( overlap.length > 0 ) {

                userRideIDInEventQueue = undefined;
                rideStatus = RideActive;
                return;
            }

        }
    }

    userRideIDInEventQueue = undefined;
    rideStatus = RideNotRequested;

}

function updateRideStatus( val ) {

    updateRideStatusValue();

    if ( rideStatus === RideNotRequested ) {

        $("#requestRideBtn").html( "Request a Ride" );
        $("#requestRideBtn").prop('disabled', false);
        $("#requestRideBtn").css('background-color', '#2196f3');

    } else if ( rideStatus === RideRequested ) {

        $("#requestRideBtn").html("Cancel Ride Request");
        $("#requestRideBtn").prop('disabled', false);
        $("#requestRideBtn").css('background-color', 'red');

    } else if ( rideStatus === RideActive ) {

        $("#requestRideBtn").html("Cancel Ride Request");
        $("#requestRideBtn").prop('disabled', true);
        $("#requestRideBtn").css('background-color', 'gray');

    }


}
$.Topic( EventQueueDidChange ).subscribe( updateRideStatus );
$.Topic( UserUIDDidChange ).subscribe( updateRideStatus );
$.Topic( EventActiveRidesDidChange ).subscribe( updateRideStatus );
$.Topic( UserRidesDidChange ).subscribe( updateRideStatus );

$("#requestRideBtn").click(function () {

    if ( rideStatus === RideNotRequested ) {

        executeRequestRide();

    } else if ( rideStatus === RideRequested ) {

        executeCancelRideRequst();

    }

});

function executeRequestRide() {


    if ( userUID ) {

        var rideKey = ref.child("rides").push().key;

        var rideData = {};
        rideData[ 'status' ] = 0;
        rideData[ 'rider' ] = userUID;
        rideData[ 'event' ] = eventID;

        var updates = {};
        updates[ '/rides/' + rideKey ] = rideData;
        updates[ '/events/' + eventID + '/queue/' + rideKey ] = userUID;
        updates[ '/users/' + userUID + '/rides/' + rideKey ] = eventName;

        ref.update(updates);

    } else {

        alert( "You must sign in before requesting a ride" );

    }

}

function executeCancelRideRequst() {

    if ( userUID && userRideIDInEventQueue ) {

        var updates = {};
        updates[ '/rides/' + userRideIDInEventQueue ] = null;
        updates[ '/events/' + eventID + '/queue/' + userRideIDInEventQueue ] = null;
        updates[ '/users/' + userUID + '/rides/' + userRideIDInEventQueue ] = null;

        ref.update(updates);

    } else {

        alert( "An error occured." );

    }


}

createEventModel(eventID);

$.Topic( UserDisplayNameDidChange ).subscribe( function ( value ) {
    $("#SignInText").html( userDisplayName ? "" + userDisplayName.split(" ")[0] : "Sign In");
});

$("#SignInButton").click( function () {

    if ( userDoesExist ) {
        firebase.auth().signOut();
    } else {
        firebase.auth().signInWithPopup(provider);
    }


});
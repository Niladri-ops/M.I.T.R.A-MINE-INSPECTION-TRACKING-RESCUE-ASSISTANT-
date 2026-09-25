function Send-RadarState {
    param(
        [bool]$Connected,
        [bool]$PossibleHuman,
        [Nullable[int]]$DistanceCm,
        [bool]$UartPresence,
        [bool]$Ot2Presence
    )

    $body = @{
        device_id      = "ESP32-RADAR-01"
        connected      = $Connected
        possibleHuman  = $PossibleHuman
        distanceCm     = $DistanceCm
        uartPresence   = $UartPresence
        ot2Presence    = $Ot2Presence
    } | ConvertTo-Json

    Invoke-RestMethod `
        -Uri "http://localhost:5000/api/radar-data" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body

    Write-Host ""
    Write-Host "Radar state sent:"
    Write-Host "Connected      : $Connected"
    Write-Host "Possible Human : $PossibleHuman"
    Write-Host "Distance       : $DistanceCm cm"
    Write-Host ""
}


Write-Host "=============================="
Write-Host " MineGuard Radar Test Module"
Write-Host "=============================="
Write-Host ""
Write-Host "1 - Area Clear"
Write-Host "2 - Human at 1.0 m"
Write-Host "3 - Human at 4.0 m"
Write-Host "4 - Human at 7.5 m"
Write-Host "5 - Radar Offline"
Write-Host "6 - Custom Distance"
Write-Host ""

$choice = Read-Host "Select test"

switch ($choice) {

    "1" {
        Send-RadarState `
            -Connected $true `
            -PossibleHuman $false `
            -DistanceCm $null `
            -UartPresence $false `
            -Ot2Presence $false
    }

    "2" {
        Send-RadarState `
            -Connected $true `
            -PossibleHuman $true `
            -DistanceCm 100 `
            -UartPresence $true `
            -Ot2Presence $true
    }

    "3" {
        Send-RadarState `
            -Connected $true `
            -PossibleHuman $true `
            -DistanceCm 400 `
            -UartPresence $true `
            -Ot2Presence $true
    }

    "4" {
        Send-RadarState `
            -Connected $true `
            -PossibleHuman $true `
            -DistanceCm 750 `
            -UartPresence $true `
            -Ot2Presence $true
    }

    "5" {
        Send-RadarState `
            -Connected $false `
            -PossibleHuman $false `
            -DistanceCm $null `
            -UartPresence $false `
            -Ot2Presence $false
    }

    "6" {
        $distance = Read-Host "Enter distance in cm"

        if (-not [int]::TryParse($distance, [ref]$null)) {
            Write-Host "Invalid distance."
            exit
        }

        Send-RadarState `
            -Connected $true `
            -PossibleHuman $true `
            -DistanceCm ([int]$distance) `
            -UartPresence $true `
            -Ot2Presence $true
    }

    default {
        Write-Host "Invalid option."
    }
}